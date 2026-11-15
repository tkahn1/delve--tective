"""Sample human and AI texts from the RAID benchmark (MIT licence).

Downloads whole parquet shards of the Hugging Face parquet conversion one at a time (one
request each, cached by huggingface_hub; ~200-290 MB per shard), keeps rows with
attack == 'none' from domains close to web articles, and stops once every pool is full.
Many small range requests trip the Hub's anonymous rate limit, so this avoids them and
backs off on HTTP 429.

Output: eval/data/raw/raid.jsonl {text, label: human|ai, domain, model, decoding, source_id}

Usage: python pipeline/lr/fetch_raid.py [--per-domain-ai 1200] [--per-domain-human 600] [--max-shards 4]
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import time
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
from huggingface_hub.errors import HfHubHTTPError

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "eval" / "data" / "raw" / "raid.jsonl"
DOMAINS = {"reviews", "news", "wiki", "recipes", "books"}
COLS = ["domain", "attack", "model", "decoding", "source_id", "generation"]


def download(shard: int) -> str:
    for attempt in range(5):
        try:
            return hf_hub_download("liamdugan/raid", f"raid/partial-train/{shard:04d}.parquet",
                                   repo_type="dataset", revision="refs/convert/parquet")
        except HfHubHTTPError as e:
            if "429" not in str(e):
                raise
            wait = 60 * (attempt + 1)
            print(f"rate limited, waiting {wait}s", flush=True)
            time.sleep(wait)
    raise RuntimeError("still rate limited")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-domain-ai", type=int, default=1200)
    ap.add_argument("--per-domain-human", type=int, default=600)
    ap.add_argument("--max-shards", type=int, default=4)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--shards", default="", help="comma list, e.g. 3,7,9 (the parquet conversion is sorted by domain: 0-2 abstracts, 2-6 books, 6-9 news)")
    a = ap.parse_args()
    rng = random.Random(a.seed)
    pools: dict[tuple[str, str], list[dict]] = defaultdict(list)
    shards = [int(s) for s in a.shards.split(",")] if a.shards else list(range(10))
    if not a.shards:
        rng.shuffle(shards)
    for shard in shards[: a.max_shards]:
        path = download(shard)
        f = pq.ParquetFile(path)
        for g in range(f.num_row_groups):
            for r in f.read_row_group(g, columns=COLS).to_pylist():
                if r["domain"] in DOMAINS and r["attack"] == "none" and r["generation"]:
                    pools[(r["domain"], "human" if r["model"] == "human" else "ai")].append(r)
        print(f"shard {shard}:", {f"{k[0]}/{k[1]}": len(v) for k, v in sorted(pools.items())}, flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with open(OUT, "w", encoding="utf-8") as out:
        for (dom, label), rows in sorted(pools.items()):
            rng.shuffle(rows)
            for r in rows[: a.per_domain_ai if label == "ai" else a.per_domain_human]:
                out.write(json.dumps({"text": r["generation"], "label": label, "domain": dom, "model": r["model"],
                                      "decoding": r["decoding"], "source_id": r["source_id"]}) + "\n")
                n += 1
    print(f"wrote {n} rows -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
