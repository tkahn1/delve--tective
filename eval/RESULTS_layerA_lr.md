# Layer A logistic regression: evaluation

Train 22060 / test 7330 chunks, split by site/source (1604 test groups). C=2.0.
Test AUC (all sources): **0.950**.

Threshold for 25% human pass: **0.2496** (probability).

| Test slice | chunks | share passing threshold |
|---|---|---|
| c4/general/human | 2616 | 28.5% |
| c4/roundup/human | 2424 | 21.2% |
| junk/web/ai | 507 | 88.4% |
| raid/books/ai | 807 | 97.4% |
| raid/news/ai | 976 | 96.5% |

Current hand-weighted layer A on the same test set: AUC **0.642**; at its own 25% human-pass threshold (0.166) it passes 47.9% of AI chunks vs **95.0%** for the new model.

Style feature weights (standardised):

- exclaim_per100: -0.713
- digit_share: -0.392
- ttr150: +0.363
- sentence_cv: -0.349
- first_person: -0.203
- token_len: -0.189
- colon_per100: +0.184
- second_person: -0.164
- comma_per_word: +0.137
- llmword_per100: +0.118
- transition_rate: +0.103
- question_per100: -0.100
- sentence_len: +0.056
- emdash_per100: +0.056
- roundup_per100: +0.051
- cliche_per100: +0.007

Caveats: AI labels for junk-site pages are site-level (some pages may be human-written); human text is a 2019 crawl, so topics and dates differ from 2026 AI pages; RAID gives AI news/books only (no human RAID rows in the parquet conversion).
