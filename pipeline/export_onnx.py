"""Export Fakespot RoBERTa to ONNX with Optimum, quantize to 8-bit, compare with PyTorch.

Fallback for pipeline/fetch_model.py (use this if the community conversion is
missing, broken, or you want to build it yourself). Output uses the same
Transformers.js layout:

  extension/public/models/fakespot-roberta/
    config.json, tokenizer.json, ...
    onnx/model.onnx             (fp32)
    onnx/model_quantized.onnx   (dynamic int8, what the extension loads with dtype 'q8')

Usage:  python pipeline/export_onnx.py [--model fakespot-ai/roberta-base-ai-text-detection-v1] [--arm64]
Needs:  pip install "optimum[onnxruntime]" torch transformers   (see requirements.txt)
"""
from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

from common import ROOT

MODEL = "fakespot-ai/roberta-base-ai-text-detection-v1"
OUT = ROOT / "extension" / "public" / "models" / "fakespot-roberta"
MAX_TOKENS = 256  # config.text.maxTokens

SAMPLES = [
    "Bought this grinder after my old blade one died. It's loud, honestly louder than I expected, and the "
    "static means grounds stick to the chute so I tap it a few times. But the grind is way more even.",
    "When it comes to brewing great coffee, the grinder plays a crucial role in unlocking the full flavor of "
    "your beans. Whether you're a seasoned home barista or just starting your coffee journey, this versatile "
    "machine delivers seamless performance and top-notch consistency.",
    "The committee met on Tuesday to review the budget. Two members asked for more detail on the road repairs, "
    "and the vote was postponed until the next meeting in March.",
    "In today's fast-paced world, finding the perfect air fryer can feel overwhelming. Look no further: this "
    "comprehensive guide will help you navigate the options and elevate your cooking to the next level.",
]


def softmax(x):
    import numpy as np
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=MODEL)
    ap.add_argument("--arm64", action="store_true", help="quantize for ARM64 instead of AVX2/AVX512")
    args = ap.parse_args()

    try:
        import numpy as np
        import torch
        from optimum.onnxruntime import ORTModelForSequenceClassification, ORTQuantizer
        from optimum.onnxruntime.configuration import AutoQuantizationConfig
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except ImportError as e:
        sys.exit(f"missing dependency ({e}); pip install -r pipeline/requirements.txt")

    tok = AutoTokenizer.from_pretrained(args.model)
    work = Path(tempfile.mkdtemp(prefix="unslop-onnx-"))
    print(f"exporting {args.model} -> {work}")
    ort_model = ORTModelForSequenceClassification.from_pretrained(args.model, export=True)
    ort_model.save_pretrained(work)
    tok.save_pretrained(work)

    # Dynamic int8 quantization (weights int8, activations quantized at runtime).
    qcfg = (AutoQuantizationConfig.arm64 if args.arm64 else AutoQuantizationConfig.avx2)(
        is_static=False, per_channel=False)
    ORTQuantizer.from_pretrained(work, file_name="model.onnx").quantize(
        save_dir=work, quantization_config=qcfg, file_suffix="quantized")

    # Transformers.js layout
    (OUT / "onnx").mkdir(parents=True, exist_ok=True)
    for f in work.iterdir():
        if f.suffix == ".onnx":
            shutil.copy2(f, OUT / "onnx" / f.name)
        elif f.is_file():
            shutil.copy2(f, OUT / f.name)
    print("files:", sorted(p.name for p in (OUT / "onnx").iterdir()))

    # Compare outputs: PyTorch vs ONNX fp32 vs ONNX int8
    import onnxruntime as ort
    pt = AutoModelForSequenceClassification.from_pretrained(args.model).eval()
    enc = tok(SAMPLES, truncation=True, max_length=MAX_TOKENS, padding=True, return_tensors="np")
    with torch.no_grad():
        p_pt = softmax(pt(**{k: torch.from_numpy(v) for k, v in enc.items()}).logits.numpy())

    def run(name: str):
        sess = ort.InferenceSession(str(OUT / "onnx" / name), providers=["CPUExecutionProvider"])
        names = {i.name for i in sess.get_inputs()}
        return softmax(sess.run(None, {k: v.astype(np.int64) for k, v in enc.items() if k in names})[0])

    p32, p8 = run("model.onnx"), run("model_quantized.onnx")
    labels = pt.config.id2label
    print(f"id2label: {labels}")
    print(f"max |pytorch - onnx fp32| = {np.abs(p_pt - p32).max():.2e}")
    print(f"max |pytorch - onnx int8| = {np.abs(p_pt - p8).max():.3f}")
    for i, s in enumerate(SAMPLES):
        print(f"  [{i}] pt={np.round(p_pt[i], 3)} int8={np.round(p8[i], 3)}  {s[:60]!r}")
    if np.abs(p_pt - p32).max() > 1e-3:
        print("WARNING: fp32 export differs from PyTorch by more than 1e-3")
    if np.abs(p_pt - p8).max() > 0.1:
        print("WARNING: int8 differs from PyTorch by more than 0.1; consider per_channel=True or fp16")
    for f in sorted((OUT / "onnx").iterdir()):
        print(f"  onnx/{f.name}: {f.stat().st_size / 1e6:.1f} MB")
    shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
