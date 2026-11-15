# Unslop UI review package

Owner: Arnav. Direction: **Quiet browser utility**, with word highlighting and explanations on hover/focus/click. This folder holds portable design previews, not a second detector.

## Open the previews

From the repository root:

```sh
python -m http.server 8080
```

Open **http://localhost:8080/UI/**.

- `article-highlights.html`: article with phrase highlights, matching-text evidence, a paragraph-model explanation, dismiss controls, and keyboard support.
- `palette-studio.html`: live dashboard palette editor with three starting palettes, native colour pickers, editable hex values, contrast checks, browser-local persistence, and CSS export. Changes affect previews only.
- `dashboard.html`: Quiet dashboard with working week/month/all-time controls. It uses the extension's **actual `summarize(Stats, range, now)` function**, bundled in `assets/stats.js`, and explicitly labeled sample data in `sample-data.js`.
- `directions.html`: all previously reviewed Search, Article, Popup, and Activity samples, with Quiet/Margin/Inspector alternatives. Quiet is the chosen starting point.
- `sources/`: editable original conversation fragments used to export the two standalone previews.

The original `Unslop UI 2.pdf`, `unslop-plan.pdf`, and skill notes `UI-REFERENCES.md` are in the repository root. The PDFs are references, not instructions that override the user or repository.

## What is live vs. illustrative

**Every finding, domain, count, and image verdict in these previews is sample data.** No page text is uploaded, and no classifier is run. The preview pages are not installed into Chrome by opening them.

The **existing installed extension** already has search annotations, article paragraph outlines, popup settings, and a live weekly-report page at `extension/src/report/index.html`. That UI has not yet been replaced by these previews. Reuse its worker messages and statistics; do not replace real results with sample data.

The word-highlighting preview extends what the current backend returns:

- The phrase list can supply exact phrase locations after a small adapter is added.
- The model returns chunk/paragraph scores, **not word-level explanations**.
- The current copy checker uses article fingerprints/known URLs. Showing exact matching sentences and source links requires additional evidence data; do not fabricate it from a cluster count.
- Images are visual concept states only; image detection is not implemented in the checked build.

## How to integrate without waiting on detector work

Use the types in `extension/CONTRACT.md` and `src/engine/messages.ts`: `PageVerdict`, `ResultVerdict`, `TabState`, and `Stats`. Build clean/loading/flagged/model-unavailable UI fixtures using those exact types. Then feed the real worker results into the same rendering functions.

No detector API changes are included in this branch. Dashboard integration can reuse the existing `stats/get` response and `summarize`, substituting real `Stats` for `sampleStats`. Keep sample data isolated in this folder.

To regenerate the dashboard's pure aggregation module after backend changes:

```sh
cd extension
npm ci
cd ..
node UI/build-preview.mjs
```

## Try the actual extension

See `TESTING.md` for model prerequisites, browser loading, supported targets, and known limitations. A normal web server is needed only for saved demo pages and these previews; the production detector runs locally inside the extension.

## Suggested implementation order

1. Wire the Quiet article interaction to existing paragraph results.
2. Add exact phrase ranges for the word-highlighting UI.
3. Restyle the actual popup and live report using the Quiet layout.
4. Add image UI only when an image detector produces real evidence.

Keep UI changes on an `arnav/*` branch. Do not change classifier thresholds or domain policies as part of a visual pass.
