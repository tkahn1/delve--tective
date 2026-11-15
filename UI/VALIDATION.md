# UI package validation

Checked November 14, 2026 on Windows, against backend base `5cddd51`.

- Extension production build: passed.
- TypeScript typecheck: passed.
- Existing Vitest suite: 37/37 passed across 6 files.
- Standalone preview browser checks: no JavaScript page errors.
- Article export: explanation opens; Escape and close dismiss it.
- Directions export: Quiet popup screen opens.
- Quiet dashboard: same aggregation function as the extension; expected fixture result counts are week 114, month 250, all time 259. Time-range controls and selected-bar detail passed.
- Dashboard at 390 px: no horizontal overflow. Desktop, narrow, and dark-mode screenshots were inspected.
- These checks validate the UI package, not detector accuracy.

Not verified here: unpacked-extension installation on this laptop, live-site end-to-end model classification, classifier accuracy, image detection, Amazon/Reddit comments. The local model weights are not installed. See TESTING.md.

Screenshots in `screenshots/` show sample data and are provided for team review.
