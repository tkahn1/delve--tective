# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repo.

## Context

- **What this is:** a hackathon project (HACK2026). 4 people, ~36 hours.
- **Goal:** a working, demoable product by the deadline. Speed and a reliable demo matter more than polish, test coverage, or perfect architecture.
- **Project summary:** Unslop, a Chrome extension (MV3) that marks AI junk in Google results and on opened pages. Every check runs on the user's computer; nothing about pages or browsing is sent anywhere.
- **Interfaces:** `extension/CONTRACT.md` is the shared contract (check shape, messages, config, storage, MinHash spec). Read it before changing anything that crosses modules.

## Stack

- Extension: TypeScript, Vite 7 + @crxjs/vite-plugin 3, Manifest V3, no UI framework (plain DOM + Shadow DOM)
- Background: service worker (storage, site list, routing) + offscreen document (text check models)
- Models: Transformers.js (`@huggingface/transformers`) running Fakespot RoBERTa ONNX on WASM, files in `extension/public/models/` (gitignored)
- Storage: `chrome.storage.local` (settings, weekly counts), `chrome.storage.session` (per-tab results)
- Offline pipeline: Python 3 (`pipeline/`)
- Package manager: npm

## Commands

```sh
# install
cd extension && npm install
# build (load extension/dist as an unpacked extension in chrome://extensions)
cd extension && npm run build
# dev (watch build)
cd extension && npm run dev
# typecheck / test
cd extension && npm run typecheck && npm test
# regenerate list data (writes extension/src/data/*.json)
python pipeline/build_sitelist.py && python pipeline/build_fingerprints.py
# serve saved demo pages
python -m http.server 8080 -d demo/pages
# download model (~125 MB) into extension/public/models/
pip install -r pipeline/requirements.txt && python pipeline/fetch_model.py
```

## Repo layout

```
extension/            # the Chrome extension (CONTRACT.md = shared interfaces)
  src/checks/         # one folder per check + types.ts, registry.ts
  src/config/         # detectors.config.ts: all thresholds, weights, URL map
  src/combine/        # evidence -> level
  src/reasons/        # fixed reason sentences
  src/engine/         # offscreen document + message types
  src/background/     # service worker
  src/content/        # content scripts + engines/google.ts
  src/ui/             # in-page Shadow DOM UI
  src/popup/ src/report/ src/storage/ src/data/
  bench/              # model speed test page
  tests/              # Vitest
pipeline/             # Python: site list, fingerprints, model export, eval
demo/pages/           # saved/mock demo pages (see demo/README.md)
eval/                 # test sets (gitignored) + RESULTS.md
UI/                   # Arnav's standalone UI previews, sample dashboard, and integration/testing notes
```

## UI work (Arnav)

- **Latest LOCAL work (not pushed):** the actual extension presentation is now named delve—tective with an em dash, an original Sherlock-inspired profile/hat/pipe mark, warm paper and brown action colours. Popup/report/options styles and Shadow DOM warning tokens are updated; worker contracts and detector settings are preserved. The user explicitly requested NO PUSH. See root `handoff.md` for verification and remaining backend work. Old lavender/SlopSniffer previews are historical alternatives, not the current brand.

- **Chosen direction:** Quiet browser utility. Keep the host page readable; small word/phrase highlights with reasons on hover, keyboard focus, or click. Avoid an always-open side panel and oversized dashboard meters/cards.
- **Review package:** serve the repo root (`python -m http.server 8080`) and open `/UI/`. Includes the article highlight preview, all three design directions, and a Quiet dashboard with working time ranges. `UI/README.md` explains integration; `UI/TESTING.md` records supported targets and setup gaps.
- **Truth boundary:** previews use labeled sample findings/counts, not live detector results. The installed extension still uses `extension/src/ui`, `popup`, and `report`. Do not replace real worker output with preview data.
- **Shared interfaces:** preserve `extension/CONTRACT.md` and `src/engine/messages.ts`. The current model returns paragraph/chunk flags, not causal word explanations; exact phrase/copy ranges require explicit evidence additions. Images are not implemented yet.
- **Dashboard data:** the standalone dashboard uses the actual `summarize(Stats, range, now)` function, bundled by `node UI/build-preview.mjs`, with separate fictional fixtures. Use `stats/get` for eventual live integration.
- **Reference documents:** `Unslop UI 2.pdf`, `unslop-plan.pdf`, and `UI-REFERENCES.md` live at the repo root. The user's current UI decisions take priority over the reference PDFs.
- **Comments/reviews:** the page/text check still skips them (Amazon and Reddit are allowlisted, comment containers are skipped). Do not silently remove these safeguards during a UI pass. Repeated comments on **YouTube videos and Reddit threads** are handled by the separate comment-copies check (see "Repeated comments" below). Amazon reviews are not supported.

## Repeated comments (YouTube + Reddit, branch `feature/yt-comment-copies`)

Flags comments that are copies of each other across a whole video or thread ("Repeated 15 times" pill on each
one, a one-line summary above the comments that expands on hover). Details: `extension/CONTRACT.md` → "Comment copies".

- **Code:** `src/checks/commentCopies/` (grouping, types, port messages), `src/content/copies/controller.ts`
  (site-agnostic), `src/content/youtube/`, `src/content/reddit/`, `src/background/commentCopies.ts`
  (grouping off the page thread + optional YouTube API), `src/ui/commentFlag.ts`, `src/ui/copiesSummary.ts`.
  Thresholds: `config.commentCopies`. Tests: `tests/commentCopies.test.ts`.
- **Uses the popup's controls:** "Flagged results" Dim/Hide also dims/hides repeated comments; Sensitivity
  (buttons Less / Normal / More = stored `relaxed` / `balanced` / `strict`) changes which groups count. The popup's
  "This page" shows a Comments line; Developer options (bottom of the popup) show scan metrics for debugging.
- **Sends requests:** unlike the other checks, it fetches comments: YouTube's own `/youtubei/v1/next` (same origin),
  Reddit's `.json` (same origin; **needs the user logged in to Reddit**, else 403), and Google's YouTube Data API only
  if a key is saved in Options. Nothing is sent anywhere else and nothing is stored but counts.
- **Gotchas:** only the visible tab scans (background tabs wait until shown). After reloading the extension, refresh
  open YouTube/Reddit tabs (the popup says so); re-injecting into open tabs fails with this build's loader. YouTube
  may answer 403 after many scans in a row; the fetcher slows down and retries. Live Reddit flag placement has been
  confirmed by one user only; Claude in Chrome can't open Reddit, so test it in a normal browser.

### Try it (for a teammate's agent)

```sh
git clone https://github.com/tkahn1/HACK2026.git
cd HACK2026
git checkout feature/yt-comment-copies
cd extension
npm ci
npm test            # 83 tests, ~1 s
npm run build       # writes extension/dist
```

Then a human: open `chrome://extensions`, turn on **Developer mode**, **Load unpacked** → `HACK2026/extension/dist`.
Check it on a big video, e.g. https://www.youtube.com/watch?v=LGHsNaIv5os (crypto guide, ~11k comments, heavy bot
spam): within ~40 s there is a summary bar above the comments and "Repeated N times" pills on comments; the popup's
"This page" shows a Comments line. The console prints one `[delve—tective] Repeated comments (YouTube): …` line per
video. Optional: a YouTube Data API key in Options makes big videos ~15 s instead of ~40 s.
The text model (`public/models/`) is not needed for this feature; without it only the paragraph outlines are missing.

## Known gotchas (updated 2026-11-14)

- **Bing and Yahoo search support (2026-11-14):** `content/engines/bing.ts` (both engines), picked by `searchEngineOf()` in `content/urlmap.ts`. Bing is tested live (dims windowsforum.com for "how to fix windows update error 0x80070005"). **Yahoo is UNVERIFIED end to end:** the selectors match a live Yahoo page (inspected in a browser), but Yahoo returned HTTP 500 to automated browsers and Yahoo search was not working for Toby either, so dimming on Yahoo has not been seen working. Sponsored results are not handled on Bing/Yahoo.
- **Site list = our `pipeline/data/sites.csv` + third-party lists in `pipeline/data/imported/`** (~2,390 domains). One imported list is GPL-3.0; see `pipeline/data/imported/NOTICE.md` before selling/licensing the list. Licence notices ship in the extension (`public/THIRD_PARTY_NOTICES.md`, `public/licenses/`).

- **No live Google search reliably shows listed junk sites yet** (checked 2026-11-14 in a signed-in browser): "best coffee grinder 2026" and "best air fryer 2026" returned none of the 5 listed domains. Opening listed pages directly works (badge + outlines). Candidates seen in live air-fryer results that still need checking: us.smartcopons.com, myplanetfood.com. Recheck live results before the demo.

- **Model download:** the source repo (`Lynote/...-browser`) only ships `onnx/model.onnx` (fp32, ~500 MB), so `fetch_model.py` does not get the 8-bit file the extension loads. Download `onnx/model.onnx` and quantize it with `onnxruntime.quantization.quantize_dynamic(..., weight_type=QuantType.QInt8)` to `extension/public/models/fakespot-roberta/onnx/model_quantized.onnx` (~125 MB). Outputs match fp32 closely on spot checks. TODO(hack): fold this into `fetch_model.py`.
- **Builds keep the same file names** (`vite.config.ts` → `output`, no content hashes, since 2026-11-15). Before, each `npm run build` renamed the content-script files and the loaded extension silently stopped working until reloaded. Now a content-script change takes effect when you refresh the page; changes to the service worker, popup or manifest still need the reload arrow on delve—tective in `chrome://extensions` (then refresh open tabs).
- **Live Google wraps result links** as `/goto?url=<opaque token>`; the real site is read from `<cite>` (`content/engines/google.ts`). Fixture: `extension/tests/fixtures/google-live-2026-11-14.html`. Automated/headless browsers get a captcha on Google; test with a saved copy or a real browser.
- **Outlines only show at level Medium/High** (`buildVerdict` in `background/service-worker.ts`). The text model alone outlined plain Wikipedia text, so text evidence is hidden on Low pages.
- **Allowlisted sites are never checked** (`src/data/allowlist.json`, 77 domains incl. Wikipedia, Reddit, NYT, BBC).
- **Site list matches by registrable domain**, so shared hosts (`*.pages.dev`) or a company subdomain can't be listed without dimming the whole parent domain.
- **Demo pages:** `demo/pages/mayfairfarms.html` and `peggyomara.html` are real saved copies (2026-11-14). The two articles are not copies of each other (MinHash similarity 0.00). The Google pages in `demo/pages/` are still mocks.
- **Only ~350 ms per chunk on WASM**; 12 chunks per page (~4 s). WebGPU measured slower. Build ships only the `asyncify` onnxruntime variant.

## Working style

- **Keep changes small and focused.** Four people (plus their agents) are editing at the same time. Touch only the files the task needs. Don't reformat, rename, or reorganize code you weren't asked to change.
- **Don't add dependencies casually.** Prefer what's already installed. If a new package is genuinely needed, say so in the summary.
- **Make it work first.** Hardcoding, mock data, and TODOs are fine when they unblock the demo. Leave a `// TODO(hack):` comment so we can find them.
- **Don't break the main path.** Before finishing, run the app (or the relevant command) and confirm the core demo flow still works.
- **Ask instead of guessing** on product decisions (what a feature should do, what the UI should say). Decide on your own for routine implementation details.

## Git

- `main` should always run. Work on short-lived branches (`name/feature`) and merge often, at least every few hours, to avoid painful conflicts.
- Pull/rebase from `main` before starting a new task.
- Write short, descriptive commit messages.
- Don't force-push to `main` or rewrite shared history.
- Agents: only commit or push when asked.

## Secrets

- Never commit API keys, tokens, or `.env` files. Put secrets in `.env` (gitignored) and keep `.env.example` updated with the variable names.
- Don't paste secrets into code comments, logs, or commit messages.

## Ownership

_TODO: who owns which area, so agents (and people) know whose code they're touching._

| Area | Owner |
| ---- | ----- |
| UI direction, article highlights, popup/dashboard presentation | Arnav |
|      |       |
|      |       |
|      |       |
