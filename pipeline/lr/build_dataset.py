"""Turn the raw downloads into labelled chunks, cut like the extension cuts pages.

Chunking mirrors extension/src/content/extract.ts: block elements (p, li, blockquote, dd) of the
main content (article/main/... with the most <p> words), merged into 80-250 word chunks,
chunks under 50 words dropped, at most 40 chunks per page. Plain-text sources (C4, RAID) use
blank-line / newline paragraphs as blocks.

Labels (noisy by design, documented in eval/RESULTS.md):
  ai    = article pages from listed junk domains (eval/data/raw/junk) + RAID generations
  human = C4 2019 crawl (roundup-like + general)
Group = site (domain) for web pages, RAID source_id for RAID, so train/test can split by group.

Output: eval/data/lr/chunks.jsonl {text, label, source, kind, group}
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "eval" / "data" / "raw"
OUT = ROOT / "eval" / "data" / "lr" / "chunks.jsonl"

MIN_WORDS, CHUNK_MIN, CHUNK_MAX, MAX_CHUNKS = 50, 80, 250, 40
ROOT_SEL = ["article", '[itemprop="articleBody"]', ".entry-content", ".post-content", ".article-body", "main", '[role="main"]']
SKIP_SEL = ("nav, header, footer, aside, form, figcaption, button, select, textarea, [role=navigation], [role=banner], "
            "[role=contentinfo], [role=complementary], [aria-hidden=true], #comments, .comments, .comment-list, .sidebar, "
            ".widget, .share, .social, .related, .breadcrumb, .toc, #toc")


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def nwords(s: str) -> int:
    return len(s.split())


def merge(blocks: list[str]) -> list[str]:
    """Port of mergeBlocks() in extract.ts."""
    chunks: list[str] = []
    cur: list[str] = []
    cur_n = 0

    def flush() -> None:
        nonlocal cur, cur_n
        if not cur:
            return
        text, n = " ".join(cur), cur_n
        if n < MIN_WORDS and chunks and nwords(chunks[-1]) + n <= CHUNK_MAX:
            chunks[-1] += " " + text
        elif n >= MIN_WORDS:
            if n > CHUNK_MAX:
                text = " ".join(text.split()[:CHUNK_MAX])
            chunks.append(text)
        cur, cur_n = [], 0

    for b in blocks:
        n = nwords(b)
        if cur_n > 0 and cur_n + n > CHUNK_MAX:
            flush()
        cur.append(b)
        cur_n += n
        if cur_n >= CHUNK_MIN:
            flush()
        if len(chunks) >= MAX_CHUNKS:
            break
    if len(chunks) < MAX_CHUNKS:
        flush()
    return chunks


def html_blocks(html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    for s in soup(["script", "style", "noscript", "template"]):
        s.decompose()
    for s in soup.select(SKIP_SEL):
        s.decompose()
    best, best_n = None, 0
    for sel in ROOT_SEL:
        for c in soup.select(sel)[:50]:
            n = sum(nwords(p.get_text(" ")) for p in c.find_all("p"))
            if n > best_n:
                best, best_n = c, n
    root = best if best is not None and best_n >= MIN_WORDS else (soup.body or soup)
    out = []
    for el in root.find_all(["p", "li", "blockquote", "dd"]):
        if el.name != "p" and el.find(["p", "li", "blockquote"]):
            continue
        if el.name == "p" and el.find_parent("p"):
            continue
        t = clean(el.get_text(" "))
        if t:
            out.append(t)
    return out


def text_blocks(text: str) -> list[str]:
    return [clean(p) for p in re.split(r"\n+", text) if clean(p)]


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    with open(OUT, "w", encoding="utf-8") as out:
        def emit(chunks: list[str], label: str, source: str, kind: str, group: str) -> None:
            for c in chunks:
                out.write(json.dumps({"text": c, "label": label, "source": source, "kind": kind, "group": group}) + "\n")
                counts[f"{source}/{label}"] = counts.get(f"{source}/{label}", 0) + 1

        for line in open(RAW / "junk" / "index.jsonl", encoding="utf-8"):
            r = json.loads(line)
            html = (RAW / "junk" / r["file"]).read_text(encoding="utf-8", errors="replace")
            emit(merge(html_blocks(html)), "ai", "junk", "web", "site:" + r["domain"])
        for line in open(RAW / "c4.jsonl", encoding="utf-8"):
            r = json.loads(line)
            emit(merge(text_blocks(r["text"])), "human", "c4", r["kind"], "site:" + r["domain"])
        for line in open(RAW / "raid.jsonl", encoding="utf-8"):
            r = json.loads(line)
            emit(merge(text_blocks(r["text"])), r["label"], "raid", r["domain"], "raid:" + str(r["source_id"]))
    print(counts, "->", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
