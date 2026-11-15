"""Download a sample of article pages from domains on our junk-site list (AI training data).

One-off data collection for the layer A logistic regression. Never part of the extension.
- Domains come from extension/src/data/sites.json (our list + imported lists).
- Per domain: try the WordPress REST API first (most content farms are WordPress), preferring
  "best"/"top"/"review" roundup posts, else article links from the homepage.
- At most --per-site pages per domain, a pause between requests to the same domain, short
  timeouts, and any domain that blocks or errors is skipped (no retries, no workarounds).

Output: eval/data/raw/junk/<domain>__<n>.html plus index.jsonl {file, domain, url, title}.
eval/data is gitignored.

Usage: python pipeline/lr/fetch_junk_pages.py [--domains 500] [--per-site 3] [--target 400]
"""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
SITES = ROOT / "extension" / "src" / "data" / "sites.json"
OUT = ROOT / "eval" / "data" / "raw" / "junk"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
TIMEOUT = 10
PAUSE = 1.5  # seconds between requests to the same domain
ROUNDUP_RE = re.compile(r"\b(best|top \d+|top|review|reviews|vs|guide)\b", re.I)
SLUG_RE = re.compile(r"/[a-z0-9]+(?:-[a-z0-9]+){3,}/?$")  # article-like slug, 4+ words

lock = threading.Lock()
saved = 0


def get(session: requests.Session, url: str) -> requests.Response | None:
    try:
        r = session.get(url, timeout=TIMEOUT, allow_redirects=True)
    except requests.RequestException:
        return None
    if r.status_code != 200:
        return None
    # Bot walls (Cloudflare etc.): skip, never try to get around them.
    if "Just a moment" in r.text[:2000] or "cf-chl" in r.text[:5000]:
        return None
    return r


def wp_posts(session: requests.Session, domain: str, n: int) -> list[dict]:
    out: list[dict] = []
    for q in ("search=best&", "search=top&", ""):
        if len(out) >= n:
            break
        r = get(session, f"https://{domain}/wp-json/wp/v2/posts?{q}per_page={n}&_fields=link,title,content")
        time.sleep(PAUSE)
        if r is None:
            if q == "":
                break
            continue
        try:
            posts = r.json()
        except ValueError:
            break
        if not isinstance(posts, list):
            break
        for p in posts:
            try:
                html = p["content"]["rendered"]
                title = BeautifulSoup(p["title"]["rendered"], "lxml").get_text(" ", strip=True)
                link = p["link"]
            except (KeyError, TypeError):
                continue
            if len(html) < 2000 or any(o["url"] == link for o in out):
                continue
            out.append({"url": link, "title": title, "html": f"<html><head><title>{title}</title></head><body><article><h1>{title}</h1>{html}</article></body></html>"})
            if len(out) >= n:
                break
    return out


def homepage_posts(session: requests.Session, domain: str, n: int) -> list[dict]:
    r = get(session, f"https://{domain}/")
    time.sleep(PAUSE)
    if r is None:
        return []
    soup = BeautifulSoup(r.text, "lxml")
    host = urlparse(r.url).hostname or domain
    links: list[str] = []
    for a in soup.find_all("a", href=True):
        u = urljoin(r.url, a["href"]).split("#")[0]
        p = urlparse(u)
        if p.hostname != host or not SLUG_RE.search(p.path) or u in links:
            continue
        links.append(u)
    links.sort(key=lambda u: 0 if ROUNDUP_RE.search(u.replace("-", " ")) else 1)
    out: list[dict] = []
    for u in links[: n * 2]:
        if len(out) >= n:
            break
        pr = get(session, u)
        time.sleep(PAUSE)
        if pr is None or len(pr.text) < 5000:
            continue
        t = BeautifulSoup(pr.text, "lxml").title
        out.append({"url": pr.url, "title": t.get_text(strip=True) if t else "", "html": pr.text})
    return out


def do_domain(domain: str, per_site: int, target: int) -> list[dict]:
    global saved
    with lock:
        if saved >= target:
            return []
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    posts = wp_posts(s, domain, per_site) or homepage_posts(s, domain, per_site)
    rows = []
    for i, p in enumerate(posts):
        with lock:
            if saved >= target:
                break
            saved += 1
        fn = f"{re.sub(r'[^a-z0-9.-]', '_', domain)}__{i}.html"
        (OUT / fn).write_text(p["html"], encoding="utf-8", errors="replace")
        rows.append({"file": fn, "domain": domain, "url": p["url"], "title": p["title"]})
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--domains", type=int, default=500)
    ap.add_argument("--per-site", type=int, default=3)
    ap.add_argument("--target", type=int, default=400)
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    domains = sorted(json.loads(SITES.read_text(encoding="utf-8")).keys())
    random.Random(a.seed).shuffle(domains)
    domains = domains[: a.domains]
    index = OUT / "index.jsonl"
    done_sites = 0
    with open(index, "w", encoding="utf-8") as f, ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(do_domain, d, a.per_site, a.target): d for d in domains}
        for fut in as_completed(futs):
            rows = fut.result()
            if rows:
                done_sites += 1
            for r in rows:
                f.write(json.dumps(r) + "\n")
            f.flush()
    print(f"saved {saved} pages from {done_sites} of {len(domains)} domains -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
