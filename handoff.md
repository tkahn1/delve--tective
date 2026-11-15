# delve—tective UI handoff

## Publication update
The user subsequently authorized pushing the UI changes. The current Walnut extension restyle, all-screen gallery, earlier design explorations and this handoff are being committed on `arnav/ui-previews` for team review. Earlier "do not push" notes below describe the previous restriction and are superseded by that explicit request. No merge into main is authorized by this push request.

## All-screen Walnut gallery

User confirmed Walnut and asked for all Toby reference screens plus current pages, AI highlighting and alternatives. New UI/walnut/ is a nine-screen local interactive gallery: Search, Article, Popup, Activity, My sites, Shopping, Reddit, YouTube, Loading/errors. First four map directly to Toby's four-page PDF. Classic/Compact/Casebook preserve Walnut but change typography/density/mastheads. Open /UI/walnut/; shareable screen/style URL parameters. Full screenshots and overview/alternatives contact sheets are in UI/walnut/screenshots/. None of this gallery changes the installed detector or theme.

Anthropic's official frontend-design skill was fetched, read and applied. find-skills checked the leaderboard, source reputation, installs and GitHub stars; UI/walnut/DESIGN-SKILLS.md records recommendations and optional install commands. No global skills installed. Impeccable scan was run; its heuristic results are recorded in UI/walnut/DESIGN.md, not claimed as a clean certification.

27 screen/style combinations rendered, 9 screens fit 390/320px, interactions passed and no JS page errors. Model highlighting is paragraph-level; word highlights are illustrative exact-match evidence. Amazon/Reddit/YouTube examples remain proposed features. All counts/names/verdicts are labelled sample. Local and uncommitted; do not push without authorization.

### Latest remote and Impeccable check
Fetched origin and checked all remote branch heads again: main remains 4ad7233; `git merge --ff-only origin/main` reports Already up to date. This is the current tkahn1/HACK2026 remote, not an assumption from memory. The local branch already includes it with uncommitted presentation changes on top. No push.

Ran the actual CLI `npx --yes impeccable detect extension/src/popup extension/src/report extension/src/options --json`. It reported five overused-font warnings for Inter plus one static flat-type-hierarchy warning in options HTML (runtime CSS is imported through TS; rendered h1 is larger). These are heuristic design findings, not tests of backend accuracy. New UI/sherlock-directions/ contains static Walnut, Library, and Case notes concepts derived from production markup. They have fictional findings and no worker connection; the installed extension retains Walnut. Browser render checks passed for all frame widths and a 390px gallery. CLI was used transiently; no global skill installation was claimed.

## Latest update: actual extension restyle (local, not pushed)

This supersedes the older preview-only status below. The user authorized integrating the design locally and explicitly said NOT to push. GitHub was fetched again; main is still 4ad7233, no newer remote commits. No commit or push was made.

The actual extension now has the delve—tective name, an original side-profile hat-and-pipe SVG mark plus 16/32/48/128px toolbar icons, warm paper #FAF7F1, walnut accents #8C5C38, dark ink #29231F, quiet borders #DED5C8, and readable action brown #744E32. The popup, actual live report, options page, and Shadow DOM warning tokens are restyled. Worker contracts, storage keys, detectors, site policies and thresholds are unchanged. Popup IDs and all controls are retained; the site controls now wrap into two rows. A missing tab result now says no check is available rather than implying a clean verdict.

Validation: build and typecheck passed; 42/42 tests passed. The rebuilt extension was loaded in an isolated automated Edge profile (not the user's regular Edge). Real worker interactions passed for personal Mark/Unmark, Trust, sensitivity, Dim/Hide, report range, and options listing. Screenshots outside the repo: ../outputs/unslop-review/sherlock-popup.png, sherlock-report.png, sherlock-sites.png. These are actual extension pages, not fixture-rendered prototypes. example.com in the screenshot is a deliberate PERSONAL TEST MARK, not automatic detection. The isolated test profile preserves that test data separately from the user's Edge.

Still missing: local model weights; validation of model label mapping and formal accuracy evaluation; Amazon/Reddit/YouTube per-comment similarity adapters and evidence; image/video detection. End-to-end live search annotation and text inference were not verified in this run. Yahoo remains unverified. The brown scheme is now the latest requested presentation; the earlier lavender previews are references only.

To try the updated build, reload the existing extension at edge://extensions or load extension/dist unpacked; its display name is now delve—tective. Refresh affected tabs. No server is required for the real extension.

Updated November 15, 2026. Owner: Arnav. Repository: tkahn1/HACK2026. Current local branch: arnav/ui-previews; fast-forwarded to origin/main 4ad7233. The first UI package was merged through PR #2. Later palette/SlopSniffer/delve—tective work is LOCAL AND UNCOMMITTED. Preserve it before switching branches. This document records decisions and pending work; do not treat sample findings as real detector output.

## Current direction and feedback
- Current requested name: **delve—tective**, with an em dash, not a hyphen. Production manifest still says Unslop.
- User liked the LEFT/Snout-o popup's structure, not the pig. No pig noses now. Small minimal Sherlock-inspired magnifying glass logo. Current CSS mark has a little hat brim; it is an early placeholder.
- Keep the UI genuinely compact: one finding, a short explanation, Compare, secondary Activity/Settings. No permanent inspector panel, large alerts, telemetry, game HUD, or re-skinning the host page.
- Palette: #F2DFD7 Powder Petal; #FEF9FF Ghost White; #D4C1EC Thistle; #9F9FED Soft Periwinkle; #736CED Medium Slate Blue. Use dark text and accessible darker purple for small labels/buttons. Forest and Ember are alternate themes. Artificer inspiration was explored, then rejected as too much; retain only the colours.
- IMPORTANT LATEST FEEDBACK: the hand-built Amazon-style page is insufficiently faithful. User wants realistic Google/Amazon/Reddit examples showing how the actual extension fits. Do not present the current fake storefront as a real screenshot. Prefer actual public-page screenshots or saved pages with clearly labelled proposed overlays.

## Files
- UI/slopsniffer/: three candidate popups; left was preferred. Original name/logo now superseded. screenshots/ contains captures. Interactions and narrow layouts were checked.
- UI/delve-tective/: latest name, magnifying glass, left-popup layout, theme selector and Amazon-style mockup. LAST AMAZON MOCKUP REJECTED FOR FIDELITY. No backend connection. Its popup is beside the page for comparison, not a proposed permanent sidebar.
- UI/palette-studio.html: preview-only native colour pickers, contrast checks, CSS export. Shares actual dashboard rendering via an iframe.
- UI/article-highlights.html and UI/sources/: phrase/copy/model explanation concepts. Exact matching passages/source links are illustrative; backend does not provide them today.
- UI/dashboard.html: quieter activity dashboard using actual summarize() with fictional Stats. Production report remains extension/src/report/.
- Root Unslop UI 2.pdf and unslop-plan.pdf: Toby's original references. Current user decisions override them.
- Outside repo, ../outputs/unslop-stitch-export and Unslop-Google-Stitch.zip: earlier design handoff; older name and Ember theme are stale. ../outputs/SlopSniffer-design-examples.zip is also superseded in name/logo.

## Intended real browser behaviour
1. Toolbar icon: user clicks it to open a roughly 330px popup anchored by Edge's toolbar. It does not pop open automatically whenever a page loads.
2. Search results: preserve native Google/Bing layout; dim flagged entries, add one reason and Show anyway. Existing production feature.
3. Article/reviews: subtle matching passage highlights and a small summary. User selects a highlight to inspect a compact explanation. No ever-open side panel. Current model supports paragraph flags; exact word/copy evidence needs new data.
4. Activity/dashboard opens as its own extension page, not over the article.

## Proposed comment similarity feature — NOT BUILT
User example: 10 coffee-grinder reviews repeat a distinctive story about a five-year-old sleeping while coffee is ground at 5 am. Compare exact/lightly edited wording across individually extracted comments. Broad topic agreement such as 'quiet grinder' alone is insufficient. No initial model training is needed for lexical overlap; paraphrase/semantic matching is extra work.

Start with one platform or a saved fixture. Preserve stable item IDs and individual authorship; compare only loaded items, exclude quoted reply text where possible, deduplicate remounted DOM items, and handle incremental loading. Supply exact matching ranges, cluster IDs, unique match count, and loaded-item count to the UI. Label '10 of 24 loaded reviews share wording', never '10 bots detected'. Similarity does not establish fraud or AI authorship. Reddit/YouTube need separate extraction adapters.

## Verified code state versus unfinished setup
Latest main 4ad7233 adds trusted sites, sensitivity, My sites management, right-click mark/trust. Prior c258b60 adds personal Mark as slop. c614184 adds Bing support (teammate tested) and Yahoo (unverified). Existing site-list, copy fingerprint, local article classifier, popup, report and search annotations are implemented. No image/video classifier. Amazon, Reddit, YouTube are allowlisted/skipped; generic comment containers excluded. Do not remove domain exclusions merely to make a UI demo look live.

Local model_quantized.onnx is ABSENT. Build success does not verify AI classification. fetch_model.py still needs source-model quantization workaround documented in AGENTS.md. Get the teammate's verified complete model directory, rebuild, check bench/bench.html. Formal eval/RESULTS.md was not run. Do not promise detection accuracy.

## Edge installation
Latest local extension/dist is built from the checked code. Open edge://extensions, enable Developer mode, Load unpacked, choose extension/dist (the directory containing manifest.json). Pin Unslop if desired. After each rebuild reload the extension and browser tabs. Model files are required only for model output; list signals can operate without them.

Team-documented test targets (not independently classified live here): https://www.talkofthehouse.com/?p=6288 (site-list reason), https://www.bing.com/search?q=how+to+fix+windows+update+error+0x80070005 (look for windowsforum.com; rankings vary). Deterministic control test: open https://example.com/, Mark as slop, inspect the personal reason, then Unmark. A personal mark is not an automatic AI detection result. Google air-fryer and coffee-grinder searches can legitimately produce zero list matches.

## Next work for UI owner
Capture real browser pages before another visual pass. Keep Google/Amazon/Reddit host typography and layout intact; isolate overlays in Shadow DOM. Integrate selected popup and live report with existing worker outputs. Read extension/CONTRACT.md and src/engine/messages.ts before crossing interfaces. Keep pending feature fixtures separate. Name/comment-feature changes need deliberate integration; current prototypes do not alter the production extension.

Serve repo root via python -m http.server 8766 --bind 127.0.0.1, then /UI/. Avoid another global redesign. Do not push or overwrite teammates' work without the user's authorization. No production extension was loaded into the user's browser by this chat; live end-to-end operation remains to be checked.
