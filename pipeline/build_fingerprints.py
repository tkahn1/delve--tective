"""MinHash + LSH clustering of the saved demo articles.

Inputs:
  demo/pages/index.csv   file,url,cluster   (file is relative to demo/pages/)
  demo/pages/<file>      saved article HTML (read as data, never executed)

Clusters are built from text similarity (LSH candidates, then signature
similarity >= --threshold). The optional `cluster` column in index.csv
FORCES pages with the same label into one cluster even when their text
differs; the script reports which clusters are text-based and which are
label-only, so the demo stays honest about it.

Outputs (extension/src/data/):
  copies.json     { "<band>:<hex8>": clusterSize }   for every page in a cluster of size > 1
  copy_urls.json  { "<normalizedUrl>": clusterSize }

Also checks MinHash parity against extension/tests/fixtures/minhash_vector.json
when that file exists (exit code 2 on mismatch).

Usage:  python pipeline/build_fingerprints.py [--threshold 0.5]
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from itertools import combinations

from common import (DEMO_PAGES, EXT_DATA, ROOT, band_keys, extract_article, normalize_url,
                    shingle_hashes, signature, similarity, tokenize, write_json)

FIXTURE = ROOT / "extension" / "tests" / "fixtures" / "minhash_vector.json"


def check_parity() -> bool | None:
    if not FIXTURE.exists():
        print("parity: fixture not found, skipped")
        return None
    f = json.loads(FIXTURE.read_text(encoding="utf-8"))
    text = f["text"]
    sig = signature(text)
    checks = {
        "tokens": tokenize(text) == f.get("tokens", tokenize(text)),
        "shingleHashes": shingle_hashes(text) == f.get("shingleHashes", shingle_hashes(text)),
        "signature": sig == f.get("signature"),
        "bandKeys": sig is not None and band_keys(sig) == f.get("bandKeys", band_keys(sig)),
    }
    ok = all(checks.values())
    print("parity vs minhash_vector.json: " + ("OK" if ok else "MISMATCH ") +
          ("" if ok else str({k: v for k, v in checks.items() if not v})))
    return ok


class DSU:
    def __init__(self, n: int) -> None:
        self.p = list(range(n))

    def find(self, x: int) -> int:
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a: int, b: int) -> None:
        self.p[self.find(a)] = self.find(b)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=0.5,
                    help="min signature similarity for a text-based link (default 0.5)")
    args = ap.parse_args()

    parity = check_parity()

    pages = []
    with open(DEMO_PAGES / "index.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            path = DEMO_PAGES / row["file"].strip()
            if not path.exists():
                print(f"skip (missing): {row['file']}")
                continue
            title, paras = extract_article(path.read_text(encoding="utf-8", errors="replace"))
            text = " ".join(paras)
            sig = signature(text)
            if sig is None:
                print(f"skip (no text): {row['file']}")
                continue
            pages.append({"file": row["file"].strip(), "url": row["url"].strip(),
                          "label": (row.get("cluster") or "").strip(), "title": title,
                          "words": len(text.split()), "sig": sig, "bands": band_keys(sig)})

    n = len(pages)
    dsu = DSU(n)

    # LSH candidates -> verified text links
    buckets: dict[str, list[int]] = defaultdict(list)
    for i, p in enumerate(pages):
        for k in p["bands"]:
            buckets[k].append(i)
    cand = {tuple(sorted(pair)) for ids in buckets.values() if len(ids) > 1
            for pair in combinations(sorted(set(ids)), 2)}
    text_links = []
    for a, b in sorted(cand):
        s = similarity(pages[a]["sig"], pages[b]["sig"])
        if s >= args.threshold:
            dsu.union(a, b)
            text_links.append((a, b, s))

    # label-forced links
    by_label: dict[str, list[int]] = defaultdict(list)
    for i, p in enumerate(pages):
        if p["label"]:
            by_label[p["label"]].append(i)
    for ids in by_label.values():
        for j in ids[1:]:
            dsu.union(ids[0], j)

    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(n):
        groups[dsu.find(i)].append(i)

    copies: dict[str, int] = {}
    copy_urls: dict[str, int] = {}
    text_linked = {a for a, _, _ in text_links} | {b for _, b, _ in text_links}
    print(f"\npages: {n}")
    for p in pages:
        print(f"  {p['file']}: {p['words']} words, title={p['title'][:70]!r}")

    print("\npairwise similarity:")
    for a, b in combinations(range(n), 2):
        print(f"  {similarity(pages[a]['sig'], pages[b]['sig']):.3f}  {pages[a]['file']} <-> {pages[b]['file']}")

    print("\nclusters (size > 1):")
    for ids in groups.values():
        if len(ids) < 2:
            continue
        size = len(ids)
        all_text = all(i in text_linked for i in ids)
        kind = "text similarity" if all_text else "LABEL-FORCED (text alone would not cluster these)"
        print(f"  size {size} [{kind}]: " + ", ".join(pages[i]["file"] for i in ids))
        for i in ids:
            for k in pages[i]["bands"]:
                copies[k] = max(copies.get(k, 0), size)
            u = normalize_url(pages[i]["url"])
            copy_urls[u] = max(copy_urls.get(u, 0), size)

    write_json(EXT_DATA / "copies.json", dict(sorted(copies.items())))
    write_json(EXT_DATA / "copy_urls.json", dict(sorted(copy_urls.items())))
    print(f"\ncopies.json: {len(copies)} band keys; copy_urls.json: {len(copy_urls)} urls")
    if parity is False:
        sys.exit(2)


if __name__ == "__main__":
    main()
