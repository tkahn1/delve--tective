"""Evaluate the text check (layer A phrases + layer B RoBERTa) on labeled chunks.

Runs the SAME ONNX file the browser uses (extension/public/models/fakespot-roberta/
onnx/model_quantized.onnx), so the numbers match what users see.

Test data: eval/data/*.jsonl (gitignored), one JSON object per line:
  {"text": "...", "label": "human" | "ai", "source": "site-or-model", "page": "page-id"}
`page` groups chunks into pages (needed for the page-level false alarm rate);
chunks without `page` only count in chunk-level numbers. Check each dataset's
licence before use. Human text should predate 2022.

Reports:
  - share of AI chunks caught (layer A pass AND layer B >= threshold)
  - share of human PAGES with any outline (page rule: >= minFlaggedChunks
    flagged among the top maxChunks layer-A-passing chunks, as in
    extension/src/checks/text/index.ts)
  - both broken down by source
and writes eval/RESULTS.md.

Usage:
  python pipeline/eval.py                 # layer A + B
  python pipeline/eval.py --layer-a-only  # no model needed
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path

from common import ROOT

EXT = ROOT / "extension"
PHRASES_JSON = EXT / "src" / "checks" / "text" / "phrases.json"
CONFIG_TS = EXT / "src" / "config" / "detectors.config.ts"
MODEL_DIR = EXT / "public" / "models" / "fakespot-roberta"
DATA_DIR = ROOT / "eval" / "data"
RESULTS = ROOT / "eval" / "RESULTS.md"


# ------------------------------------------------------------------ config ---

def read_config() -> dict:
    """Pull the few numbers we need out of detectors.config.ts (fallback: defaults)."""
    cfg = {"minWords": 50, "maxChunks": 6, "maxTokens": 256, "minFlaggedChunks": 2,
           "passThreshold": 0.3, "threshold": 0.9, "aiLabels": ["AI", "LABEL_1", "Fake"]}
    try:
        src = CONFIG_TS.read_text(encoding="utf-8")
        # only look at the value object, not the interface
        body = src[src.find("export const config"):] if "export const config" in src else src
        for key in ("minWords", "maxChunks", "maxTokens", "minFlaggedChunks", "passThreshold", "threshold"):
            m = re.search(rf"\b{key}\s*:\s*([0-9.]+)", body)
            if m:
                cfg[key] = float(m.group(1)) if "." in m.group(1) else int(m.group(1))
        m = re.search(r"aiLabels\s*:\s*\[([^\]]*)\]", body)
        if m:
            cfg["aiLabels"] = re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))
    except OSError:
        print("warning: detectors.config.ts not found, using defaults")
    return cfg


# ----------------------------------------------------------------- layer A ---
# Port of extension/src/checks/text/scorers/phrases.ts. Keep in sync.

class LayerA:
    def __init__(self) -> None:
        lists = json.loads(PHRASES_JSON.read_text(encoding="utf-8"))
        phrases = sorted(lists["phrases"], key=len, reverse=True)
        transitions = sorted(lists["transitions"], key=len, reverse=True)
        self.phrase_re = re.compile(r"(?<![a-z0-9])(?:" + "|".join(map(re.escape, phrases)) + ")")
        self.transition_re = re.compile(r"^(?:" + "|".join(map(re.escape, transitions)) + r")(?![a-z0-9])")

    @staticmethod
    def normalize(text: str) -> str:
        return re.sub(r"[“”]", '"', re.sub(r"[‘’ʼ]", "'", text.lower()))

    @staticmethod
    def count_words(text: str) -> int:
        return len(re.findall(r"\S+", text))

    def features(self, text: str) -> dict:
        t = self.normalize(text)
        words = self.count_words(t)
        hits = len(self.phrase_re.findall(t))
        sentences = [re.sub(r"^[^a-z0-9]+", "", s.strip())
                     for s in re.split(r"(?<=[.!?])\s+|\n+", t)]
        sentences = [s for s in sentences if s]
        transitions = sum(1 for s in sentences if self.transition_re.search(s))
        lens = [self.count_words(s) for s in sentences]
        cv = 0.0
        if len(lens) >= 3:
            mean = sum(lens) / len(lens)
            var = sum((x - mean) ** 2 for x in lens) / len(lens)
            cv = math.sqrt(var) / mean if mean > 0 else 0.0
        return {"words": words, "phraseHits": hits,
                "phraseDensity": hits * 100 / words if words else 0.0,
                "transitionRate": transitions / len(sentences) if sentences else 0.0,
                "sentenceCv": cv, "sentences": len(lens)}

    def score(self, text: str) -> float:
        f = self.features(text)
        c = lambda x: 0.0 if x < 0 else 1.0 if x > 1 else x  # noqa: E731
        phrase = c(f["phraseDensity"] / 2)
        transition = c(f["transitionRate"] / 0.25)
        uniform = c((0.55 - f["sentenceCv"]) / 0.35) if f["sentences"] >= 3 else 0.0
        return c(0.6 * phrase + 0.2 * transition + 0.2 * uniform)


# ----------------------------------------------------------------- layer B ---

class LayerB:
    def __init__(self, model_dir: Path, max_tokens: int, ai_labels: list[str]) -> None:
        import numpy as np  # noqa: F401
        import onnxruntime as ort
        from tokenizers import Tokenizer

        onnx = model_dir / "onnx" / "model_quantized.onnx"
        if not onnx.exists():
            sys.exit(f"model not found: {onnx}\nrun: python pipeline/fetch_model.py  (or --layer-a-only)")
        self.sess = ort.InferenceSession(str(onnx), providers=["CPUExecutionProvider"])
        self.inputs = {i.name for i in self.sess.get_inputs()}
        self.tok = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
        self.tok.enable_truncation(max_length=max_tokens)  # includes <s> and </s>, like the browser
        self.tok.no_padding()

        id2label = json.loads((model_dir / "config.json").read_text(encoding="utf-8")).get("id2label", {})
        labels = {int(k): str(v) for k, v in id2label.items()}
        lower = [a.lower() for a in ai_labels]
        self.ai_idx = next((i for i, l in labels.items() if l.lower() in lower), None)
        self.human_idx = next((i for i, l in labels.items()
                               if l.lower() in ("human", "label_0", "real", "original")), None)
        print(f"layer B: {onnx.name}, labels={labels}, ai_idx={self.ai_idx}")

    def score(self, text: str) -> float:
        import numpy as np
        enc = self.tok.encode(text)
        feed = {"input_ids": np.array([enc.ids], dtype=np.int64),
                "attention_mask": np.array([enc.attention_mask], dtype=np.int64)}
        if "token_type_ids" in self.inputs:
            feed["token_type_ids"] = np.zeros_like(feed["input_ids"])
        logits = self.sess.run(None, {k: v for k, v in feed.items() if k in self.inputs})[0][0]
        e = np.exp(logits - logits.max())
        probs = e / e.sum()
        if self.ai_idx is not None:
            return float(probs[self.ai_idx])
        if self.human_idx is not None:
            return float(1 - probs[self.human_idx])
        return 0.0


# -------------------------------------------------------------------- eval ---

def load_data(data_dir: Path = DATA_DIR) -> list[dict]:
    rows = []
    for path in sorted(data_dir.glob("*.jsonl")):
        with open(path, encoding="utf-8") as f:
            for n, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                r = json.loads(line)
                if r.get("label") not in ("human", "ai") or not r.get("text"):
                    print(f"skip {path.name}:{n} (needs text and label human|ai)")
                    continue
                r.setdefault("source", path.stem)
                r["_file"] = path.name
                rows.append(r)
    return rows


def pct(a: int, b: int) -> str:
    return f"{100 * a / b:.1f}% ({a}/{b})" if b else "n/a"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--layer-a-only", action="store_true")
    ap.add_argument("--model-dir", type=Path, default=MODEL_DIR)
    ap.add_argument("--data-dir", type=Path, default=DATA_DIR)
    ap.add_argument("--no-write", action="store_true", help="do not write eval/RESULTS.md")
    args = ap.parse_args()

    cfg = read_config()
    rows = load_data(args.data_dir)
    if not rows:
        sys.exit(f"no data: put *.jsonl files in {args.data_dir} (see docstring for format)")

    la = LayerA()
    lb = None if args.layer_a_only else LayerB(args.model_dir, cfg["maxTokens"], cfg["aiLabels"])

    # score every eligible chunk
    for r in rows:
        r["eligible"] = la.count_words(r["text"]) >= cfg["minWords"]
        r["a"] = la.score(r["text"]) if r["eligible"] else 0.0
        r["a_pass"] = r["eligible"] and r["a"] >= cfg["passThreshold"]
        r["b"] = None
        if lb and r["a_pass"]:
            r["b"] = lb.score(r["text"])
        # chunk is flagged when it passes A and B clears the threshold
        r["flag"] = bool(r["a_pass"] and r["b"] is not None and r["b"] >= cfg["threshold"])

    elig = [r for r in rows if r["eligible"]]
    by_src = defaultdict(list)
    for r in elig:
        by_src[(r["label"], r["source"])].append(r)

    # page rule: top maxChunks A-passing chunks (by A score) -> flagged count >= minFlaggedChunks
    pages = defaultdict(list)
    for r in elig:
        if r.get("page"):
            pages[(r["label"], r["source"], str(r["page"]))].append(r)

    def page_outlined(chunks: list[dict]) -> bool:
        top = sorted([c for c in chunks if c["a_pass"]], key=lambda c: -c["a"])[: cfg["maxChunks"]]
        return sum(c["flag"] for c in top) >= cfg["minFlaggedChunks"]

    lines = [f"# Text check eval results\n",
             f"Run: {dt.datetime.now().strftime('%Y-%m-%d %H:%M')} &middot; "
             f"layers: {'A only' if lb is None else 'A + B (onnx/model_quantized.onnx)'}\n",
             f"Config: minWords={cfg['minWords']}, layerA.passThreshold={cfg['passThreshold']}, "
             f"layerB.threshold={cfg['threshold']}, maxChunks={cfg['maxChunks']}, "
             f"minFlaggedChunks={cfg['minFlaggedChunks']}, maxTokens={cfg['maxTokens']}\n",
             f"Data: {len(rows)} chunks from {len({r['_file'] for r in rows})} files in eval/data/, "
             f"{len(elig)} with >= {cfg['minWords']} words.\n"]

    ai = [r for r in elig if r["label"] == "ai"]
    hu = [r for r in elig if r["label"] == "human"]
    hu_pages = [v for (lab, _, _), v in pages.items() if lab == "human"]
    ai_pages = [v for (lab, _, _), v in pages.items() if lab == "ai"]

    lines += ["## Headline\n", "| Metric | Value |", "| --- | --- |",
              f"| AI chunks passing layer A | {pct(sum(r['a_pass'] for r in ai), len(ai))} |",
              f"| Human chunks passing layer A | {pct(sum(r['a_pass'] for r in hu), len(hu))} |"]
    if lb:
        lines += [f"| **AI chunks caught (A and B)** | {pct(sum(r['flag'] for r in ai), len(ai))} |",
                  f"| Human chunks flagged (A and B) | {pct(sum(r['flag'] for r in hu), len(hu))} |",
                  f"| **Human pages with any outline** | {pct(sum(map(page_outlined, hu_pages)), len(hu_pages))} |",
                  f"| AI pages with an outline | {pct(sum(map(page_outlined, ai_pages)), len(ai_pages))} |"]
    lines.append("")

    lines += ["## By source\n", "| Label | Source | Chunks | Pass A | Flagged (A+B) | Pages | Pages outlined |",
              "| --- | --- | --- | --- | --- | --- | --- |"]
    for (lab, src), rs in sorted(by_src.items()):
        sp = [v for (l2, s2, _), v in pages.items() if l2 == lab and s2 == src]
        flagged = pct(sum(r["flag"] for r in rs), len(rs)) if lb else "-"
        outlined = pct(sum(map(page_outlined, sp)), len(sp)) if lb and sp else "-"
        lines.append(f"| {lab} | {src} | {len(rs)} | {pct(sum(r['a_pass'] for r in rs), len(rs))} | "
                     f"{flagged} | {len(sp)} | {outlined} |")
    lines += ["", "Note: with n human pages and zero outlines, the 95% upper bound on the false alarm "
              "rate is about 3/n (50 pages -> ~6%).", ""]

    report = "\n".join(lines)
    print("\n" + report)
    if not args.no_write:
        RESULTS.write_text(report, encoding="utf-8", newline="\n")
        print(f"wrote {RESULTS}")


if __name__ == "__main__":
    main()
