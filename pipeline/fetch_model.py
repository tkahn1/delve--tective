"""Download the browser-ready ONNX conversion of the Fakespot RoBERTa detector.

Source: Lynote/fakespot-ai-roberta-base-ai-text-detection-v1-browser (Hugging Face),
a community ONNX conversion of fakespot-ai/roberta-base-ai-text-detection-v1.
Check the licence on the model card before shipping.

Writes Transformers.js layout into extension/public/models/fakespot-roberta/:
  config.json, tokenizer.json, tokenizer_config.json, ... , onnx/model_quantized.onnx
(config.text.layerB.dtype 'q8' -> onnx/model_quantized.onnx). That folder is
gitignored; it is bundled into the extension build.

If the repo lacks model_quantized.onnx, run pipeline/export_onnx.py instead.

Usage:  python pipeline/fetch_model.py [--revision main] [--all-onnx]
Needs:  pip install huggingface_hub
"""
from __future__ import annotations

import argparse
import json
import sys

from common import ROOT

REPO = "Lynote/fakespot-ai-roberta-base-ai-text-detection-v1-browser"
OUT = ROOT / "extension" / "public" / "models" / "fakespot-roberta"

BASE_FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json",
              "vocab.json", "merges.txt", "preprocessor_config.json", "quantize_config.json"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--revision", default="main", help="pin a commit hash for reproducible builds")
    ap.add_argument("--all-onnx", action="store_true", help="also fetch fp32/fp16 ONNX variants")
    args = ap.parse_args()

    try:
        from huggingface_hub import list_repo_files, snapshot_download
    except ImportError:
        sys.exit("pip install huggingface_hub  (see pipeline/requirements.txt)")

    files = list_repo_files(REPO, revision=args.revision)
    print(f"{REPO}@{args.revision}: {len(files)} files")
    onnx = [f for f in files if f.endswith(".onnx") or f.endswith(".onnx_data")]
    print("onnx files:", onnx)

    patterns = list(BASE_FILES) + (["onnx/*"] if args.all_onnx else ["onnx/model_quantized.onnx"])
    snapshot_download(REPO, revision=args.revision, local_dir=OUT, allow_patterns=patterns)

    q = OUT / "onnx" / "model_quantized.onnx"
    if not q.exists():
        alt = [f for f in onnx if "quant" in f or "int8" in f or "q8" in f]
        print(f"WARNING: {q} missing. Quantized candidates in repo: {alt or 'none'}.\n"
              "Download one and rename it to onnx/model_quantized.onnx, or run pipeline/export_onnx.py.")
    for p in sorted(OUT.rglob("*")):
        if p.is_file():
            print(f"  {p.relative_to(OUT)}  {p.stat().st_size / 1e6:.1f} MB")

    cfg = OUT / "config.json"
    if cfg.exists():
        id2label = json.loads(cfg.read_text(encoding="utf-8")).get("id2label")
        print("id2label:", id2label, "-> make sure the AI label is in config.text.layerB.aiLabels")


if __name__ == "__main__":
    main()
