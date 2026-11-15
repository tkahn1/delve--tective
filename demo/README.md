# demo/

**Live Google (2026-11-14):** neither "best coffee grinder 2026" nor "best air fryer 2026" currently shows a listed junk site, so pick the demo search after re-checking live results. Listed junk pages opened directly (e.g. https://www.talkofthehouse.com/?p=6288) show the badge and outlines. The saved Google pages below are mocks with placeholder results.

Offline copies of the demo pages, so the demo works even when the live sites change or block us.
These files are data: they are served as static HTML, never built or imported.

## Serve

```sh
python -m http.server 8080 -d demo/pages
```

Then open http://localhost:8080/google-coffee-grinder.html (backup: `google-air-fryer.html`).
The extension maps these file names to the real URLs via `config.urlMap`
(`extension/src/config/detectors.config.ts`) when the page is on localhost or file://.

## Files in `pages/`

| File | What it is |
| --- | --- |
| `google-coffee-grinder.html` | **Mock** Google results for "best coffee grinder 2026" with Google-like DOM (`div#search > div#rso > div.MjjYud > div.g[data-hveid]`, `a[href] > h3`, `cite`, `div.VwiC3b`). 10 results: 4 junk with the "(November 2026) Trusted Reviews" title (mayfairfarms.com, peggyomara.com, and two placeholders), 6 legit. |
| `google-air-fryer.html` | **Mock** results for the backup search "best air fryer 2026", same structure, 8 results (3 junk). |
| `peggyomara.html`, `mayfairfarms.html` | **Offline reconstructions** of the two junk coffee-grinder roundups (see below). |
| `archive/peggyomara-best-coffee-makers.html`, `archive/mayfairfarms-best-stanley-cups.html` | **Real** pages from the same two sites, saved from the Wayback Machine (raw `id_` snapshots from 2026-08-10 and 2026-10-13). Same WordPress/GeneratePress buying-guide template, other topics. |
| `index.csv` | `file,url,cluster` input for `pipeline/build_fingerprints.py`. |

## Honesty notes (TODO(hack))

- `curl` on https://www.mayfairfarms.com/?p=73153 and https://www.peggyomara.com/best-coffee-grinders/
  returned HTTP 403 with a Cloudflare "Just a moment..." challenge (2026-11-14). We did not try to get
  around it. The Wayback Machine has no snapshot of either URL.
- So `peggyomara.html` and `mayfairfarms.html` are hand-built reconstructions: markup and wording
  imitate the real template in `archive/`, with coffee-grinder content. The two share most of their
  text (same intro, product reviews, buying guide; different product order, nav, byline, FAQ length),
  which is why they cluster on text similarity (0.91), not only on the `trusted-reviews` label.
  Whether the live pages really share that much text is **not verified**.
- The Google pages are hand-built mocks, not saved results. Snippet text and some URLs (reddit,
  consumerreports, coffeegeek paths) are made up for the layout.
- Placeholder junk domains (thornbury-homestead.com, ashgrovegardenclub.com, maplehollowquilts.com,
  oakmontchessclub.org) did not resolve in DNS on 2026-11-14. They are on the site list only so the mock
  pages show the same-title check. Remove them before shipping.

**To replace with real copies:** open each URL in Chrome (a normal visit passes the challenge),
use Save page as... > "Webpage, HTML only" with the same file name, then run
`python pipeline/build_fingerprints.py` and check its "clusters" output. For the Google pages, search
in a signed-out window and save the same way.

## Copy-check demo

`copy-demo-a.html`, `copy-demo-b.html` and `copy-demo-c.html` are **made-up demo pages** on fictional `.example`
sites. They carry the same farm-style article, lightly reworded, so the copy check can be shown locally.
`pipeline/build_fingerprints.py` clusters them (similarity 0.79 to 0.87), and opening any one shows
**"Flagged · Same article appears on 2 other sites"**. Their fingerprints only match these demo pages.

```sh
python -m http.server 8080 -d demo/pages   # then open http://localhost:8080/copy-demo-a.html
```

