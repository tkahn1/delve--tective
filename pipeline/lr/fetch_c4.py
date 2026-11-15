"""Sample human web text from C4 (2019 crawl, ODC-BY): safely pre-LLM human writing.

Downloads one or two validation shards of allenai/c4 'en' (~40 MB each) and keeps:
  - roundup/review-like pages (titles or text about "best", "review", "top N", buying guides),
    the human counterpart of mass-generated product roundups, and
  - a random sample of other pages for general coverage.
Output: eval/data/raw/c4.jsonl {text, label: "human", domain, url, kind: roundup|general}

Usage: python pipeline/lr/fetch_c4.py [--shards 2] [--roundup 3000] [--general 2000]
"""
from __future__ import annotations

import argparse
import gzip
import json
import random
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from huggingface_hub import hf_hub_download

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "eval" / "data" / "raw" / "c4.jsonl"
ROUNDUP = re.compile(r"\b(best \w+ (for|of|to)|top \d+|buying guide|reviews? of|our picks|we tested|pros and cons|is it worth)\b", re.I)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shards", type=int, default=2)
    ap.add_argument("--roundup", type=int, default=3000)
    ap.add_argument("--general", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    rng = random.Random(a.seed)
    roundup, general = [], []
    for i in range(a.shards):
        p = hf_hub_download("allenai/c4", f"en/c4-validation.{i:05d}-of-00008.json.gz", repo_type="dataset")
        with gzip.open(p, "rt", encoding="utf-8") as f:
            for line in f:
                d = json.loads(line)
                t = d["text"]
                if len(t.split()) < 150:
                    continue
                host = (urlparse(d["url"]).hostname or "").removeprefix("www.")
                row = {"text": t, "label": "human", "domain": host, "url": d["url"]}
                if len(ROUNDUP.findall(t[:3000])) >= 2:
                    roundup.append({**row, "kind": "roundup"})
                else:
                    general.append({**row, "kind": "general"})
        print(f"shard {i}: roundup {len(roundup)} general {len(general)}", flush=True)
    rng.shuffle(roundup)
    rng.shuffle(general)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    rows = roundup[: a.roundup] + general[: a.general]
    with open(OUT, "w", encoding="utf-8") as out:
        for r in rows:
            out.write(json.dumps(r) + "\n")
    print(f"wrote {len(rows)} rows ({min(len(roundup), a.roundup)} roundup) -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
