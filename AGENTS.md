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
```

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
|      |       |
|      |       |
|      |       |
|      |       |
