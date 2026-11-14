"""Shared helpers for the Unslop offline pipeline.

MinHash + LSH here MUST match extension/src/checks/copy/minhash.ts bit-for-bit
(see extension/CONTRACT.md, "MinHash spec"). build_fingerprints.py checks this
against extension/tests/fixtures/minhash_vector.json when that file exists.

Standard library only, so the sitelist/fingerprint scripts run without installs.
"""
from __future__ import annotations

import html
import json
import re
import struct
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
EXT_DATA = ROOT / "extension" / "src" / "data"
PIPE_DATA = ROOT / "pipeline" / "data"
DEMO_PAGES = ROOT / "demo" / "pages"

NUM_HASHES = 128
SHINGLE = 5
BANDS = 32
ROWS = 4

FNV_OFFSET = 0x811C9DC5
FNV_PRIME = 0x01000193
M32 = 0xFFFFFFFF


# ---------------------------------------------------------------- MinHash ---

def fnv1a_bytes(data: bytes) -> int:
    """FNV-1a 32-bit over bytes, unsigned."""
    h = FNV_OFFSET
    for b in data:
        h ^= b
        h = (h * FNV_PRIME) & M32
    return h


def fnv1a(s: str) -> int:
    return fnv1a_bytes(s.encode("utf-8"))


_NON_ALNUM = re.compile(r"[^a-z0-9]")


def tokenize(text: str) -> list[str]:
    # JS toLowerCase() then /[^a-z0-9]/g -> ' '. Python lower() differs from JS
    # only on a few exotic code points, which become spaces here anyway.
    return [t for t in _NON_ALNUM.sub(" ", text.lower()).split() if t]


def shingles(tokens: list[str], k: int = SHINGLE) -> list[str]:
    return [" ".join(tokens[i : i + k]) for i in range(len(tokens) - k + 1)]


def _imul(a: int, b: int) -> int:
    """Math.imul followed by >>> 0 (unsigned 32-bit product)."""
    return (a * b) & M32


SEEDS = [_imul(i + 1, 0x9E3779B1) for i in range(NUM_HASHES)]


def _mix(x: int, seed: int) -> int:
    h = (x ^ seed) & M32
    h = _imul(h ^ (h >> 16), 0x85EBCA6B)
    h = _imul(h ^ (h >> 13), 0xC2B2AE35)
    return (h ^ (h >> 16)) & M32


def shingle_hashes(text: str) -> list[int]:
    return [fnv1a(s) for s in shingles(tokenize(text))]


def signature(text: str) -> list[int] | None:
    """128-slot MinHash signature; None when the text has fewer than 5 tokens."""
    xs = set(shingle_hashes(text))
    if not xs:
        return None
    sig = [M32] * NUM_HASHES
    for x in xs:
        for i in range(NUM_HASHES):
            v = _mix(x, SEEDS[i])
            if v < sig[i]:
                sig[i] = v
    return sig


def band_keys(sig: list[int]) -> list[str]:
    """LSH keys '<b>:<hex8>' (32 bands x 4 rows, little-endian uint32 bytes)."""
    keys = []
    for b in range(BANDS):
        buf = struct.pack("<4I", *sig[b * ROWS : (b + 1) * ROWS])
        keys.append(f"{b}:{fnv1a_bytes(buf):08x}")
    return keys


def similarity(a: list[int], b: list[int]) -> float:
    n = min(len(a), len(b))
    if n == 0:
        return 0.0
    return sum(1 for i in range(n) if a[i] == b[i]) / n


# ------------------------------------------------------------------- URLs ---

def normalize_url(url: str) -> str:
    """host without www + pathname without trailing slash + search, lowercase.

    Mirrors normalizeUrl() in extension/src/util/domain.ts.
    """
    try:
        u = urlsplit(url)
        if not u.scheme or not u.hostname:
            raise ValueError
        host = u.hostname.lower()
        if host.startswith("www."):
            host = host[4:]
        path = re.sub(r"/+$", "", u.path)
        search = f"?{u.query}" if u.query else ""
        return (host + path + search).lower()
    except ValueError:
        return (url or "").lower()


def registrable_domain(hostname: str) -> str:
    """Rough registrable domain (mirrors util/domain.ts for common cases)."""
    h = (hostname or "").strip().lower().rstrip(".")
    h = re.sub(r"^www\d*\.", "", h)
    parts = [p for p in h.split(".") if p]
    if len(parts) <= 2:
        return ".".join(parts)
    two = ".".join(parts[-2:])
    if two in {"co.uk", "org.uk", "ac.uk", "com.au", "co.nz", "co.jp", "co.in", "com.br"}:
        return ".".join(parts[-3:])
    return two


# ------------------------------------------------------- Article extraction ---

_SKIP = {"script", "style", "noscript", "template", "svg", "nav", "header", "footer",
         "aside", "form", "button", "select", "iframe", "figure"}
_BLOCK = {"p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "blockquote", "dd", "dt", "pre"}
_VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
         "param", "source", "track", "wbr"}


class _ArticleParser(HTMLParser):
    """Collects text blocks, remembering whether each sits inside the main article.

    'Main article' = inside <article>, <main>, or an element whose class contains
    'entry-content' / 'post-content' / 'article-body'.
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool, bool]] = []  # (tag, is_skip, is_main)
        self.skip_depth = 0
        self.main_depth = 0
        self.block_depth = 0
        self.buf: list[str] = []
        self.blocks: list[tuple[str, bool]] = []
        self.title = ""
        self._in_title = False

    def _flush(self) -> None:
        text = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        self.buf = []
        if text:
            self.blocks.append((text, self.main_depth > 0))

    def handle_starttag(self, tag, attrs):
        if tag in _VOID:
            return
        a = dict(attrs)
        cls = (a.get("class") or "").lower()
        is_skip = tag in _SKIP or "screen-reader-text" in cls or a.get("aria-hidden") == "true"
        is_main = tag in ("article", "main") or any(
            k in cls for k in ("entry-content", "post-content", "article-body"))
        if tag == "title":
            self._in_title = True
        if tag in _BLOCK and self.block_depth == 0:
            self._flush()
        if tag in _BLOCK:
            self.block_depth += 1
        self.stack.append((tag, is_skip, is_main))
        self.skip_depth += is_skip
        self.main_depth += is_main

    def handle_endtag(self, tag):
        if tag in _VOID:
            return
        if tag == "title":
            self._in_title = False
        # pop to the matching tag (tolerate sloppy HTML)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for t, s, m in self.stack[i:]:
                    self.skip_depth -= s
                    self.main_depth -= m
                    if t in _BLOCK:
                        self.block_depth -= 1
                        if self.block_depth == 0:
                            self._flush()
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self._in_title:
            self.title += data
            return
        if self.skip_depth == 0 and self.block_depth > 0:
            self.buf.append(data)


def extract_article(raw_html: str) -> tuple[str, list[str]]:
    """Return (title, paragraphs) of the main article text.

    Approximates what the content script reads (article/main paragraphs);
    it does not need to be identical, since MinHash similarity tolerates
    small differences. Falls back to every block on the page.
    """
    p = _ArticleParser()
    p.feed(raw_html)
    p.close()
    p._flush()
    main = [t for t, m in p.blocks if m]
    blocks = main if sum(len(t.split()) for t in main) >= 50 else [t for t, _ in p.blocks]
    title = html.unescape(re.sub(r"\s+", " ", p.title)).strip()
    return title, blocks


# ---------------------------------------------------------------- I/O ---

def write_json(path: Path, obj, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(obj, separators=(",", ":"), sort_keys=True)
    else:
        text = json.dumps(obj, indent=2, sort_keys=isinstance(obj, dict), ensure_ascii=False)
    path.write_text(text + "\n", encoding="utf-8", newline="\n")
