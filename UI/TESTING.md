# Trying the current detector on websites

Implementation checked against main commit `5cddd51` on November 14, 2026. These are implementation/documentation findings, not a claim that this branch independently validated detector accuracy on the live web.

## Is the backend done?

It is a working prototype with unfinished validation and setup. Site-list, copy, and text checks are implemented. No image or video detector is registered. `eval/RESULTS.md` still says “Not run yet”; small tuning results appear in the latest config/commit notes instead.

The classifier's latest tuning note reports 1/61 human pages outlined and 7/16 suspected AI/content-farm pages caught. Those are small, development-selected sets and do not establish accuracy on reviews, comments, arbitrary writing, or new generators. Site-list hits are list membership, not an AI verdict.

## Local setup

1. In `extension/`, run `npm ci`, then `npm run build`.
2. Open `chrome://extensions`, enable Developer mode, and load the repository's `extension/dist` folder unpacked.
3. Reload the extension and the affected browser tabs after **every rebuild**. Allow file-URL access only if you use file-based demo pages.
4. Check the extension's bench page: `chrome-extension://<extension-id>/bench/bench.html`. This must show the model as available before treating text-model output as working.

### Model files are a separate prerequisite

Weights are gitignored and are not included with this UI branch. Building successfully does not mean the model is installed.

The current `pipeline/fetch_model.py` requests a quantized file that the source conversion does not provide. Current `AGENTS.md` records the workaround: obtain `onnx/model.onnx` (~500 MB), quantize it with ONNX Runtime to `extension/public/models/fakespot-roberta/onnx/model_quantized.onnx` (~125 MB), and keep the associated config/tokenizer files alongside it. Use the backend teammate's verified model folder or follow that documented conversion. Rebuild afterward. Also verify the actual AI/human label mapping; the scorer still contains a TODO about it.

Without those weights, list/copy signals can still work; paragraph-model highlighting cannot be assumed to work.

## What to try

- **A listed article:** the team's documented live example is https://www.talkofthehouse.com/?p=6288 . Open it directly and inspect the actual reason. A site-list warning is different from a paragraph-model warning.
- **Saved real articles:** serve the repository root with `python -m http.server 8080`, then open `http://localhost:8080/demo/pages/mayfairfarms.html` and `peggyomara.html`. Current AGENTS says these are real saved pages. Their measured similarity is 0.00; do not demonstrate them as verified duplicates. Older text in `demo/README.md` still describes reconstructions and is stale.
- **Search filtering:** the Google adapter now handles observed real `/goto` links, but the team's coffee-grinder/air-fryer queries did not reliably include listed domains. A real search can legitimately show no warnings. Saved Google demo pages are mocks, not evidence that the live query yields those results.
- **An unlisted long article:** useful for observing actual classifier behavior. An unflagged page is not proof of human authorship or quality. A warning is not proof of AI authorship or falsehood.

## Amazon reviews and Reddit comments

**Not supported by the current build.**

- `amazon.com`, `amazon.co.uk`, and `reddit.com` are explicitly allowlisted, which bypasses checking.
- The extractor skips common comment containers (`#comments`, `.comments`, `.comment-list`).
- It was designed to merge article paragraphs, not preserve individual review/comment boundaries.
- Many comments are below the 50-word minimum; the current page rule also requires at least 3 flagged chunks.
- There are no dedicated review/comment adapters or validated short-text thresholds.

Supporting those surfaces needs explicit scope work: per-item extraction, individual authorship boundaries, dynamic loading, an intentional site-policy change, and evaluation for short content. Do not combine unrelated people's comments into one scored paragraph or claim “no AI found” when a page was skipped.

## UI review checklist

Open `UI/index.html` through the local server. Verify evidence opens, dismiss/Show anyway works, Escape closes explanations, keyboard focus remains visible, dashboard ranges update actual sample totals, and screens fit at 390 px. The previews contain illustrative findings and are independent of the classifier.
