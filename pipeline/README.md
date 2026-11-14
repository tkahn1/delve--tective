# pipeline/ (offline, Python)

Builds the data the extension ships with. Nothing here runs in the browser.
Run every command from the repo root.

```sh
python pipeline/build_sitelist.py       # data/sites.csv + allowlist.txt + builders.json -> extension/src/data/{sites,allowlist,builders}.json
python pipeline/build_fingerprints.py   # demo/pages/index.csv + saved HTML -> extension/src/data/{copies,copy_urls}.json
pip install -r pipeline/requirements.txt          # only for the three scripts below
python pipeline/fetch_model.py          # downloads the ONNX model into extension/public/models/fakespot-roberta/ (gitignored)
python pipeline/export_onnx.py          # fallback: build + 8-bit quantize the ONNX model yourself, compare with PyTorch
python pipeline/eval.py [--layer-a-only]          # text check numbers -> eval/RESULTS.md
```

`build_sitelist.py` and `build_fingerprints.py` use only the standard library.

## Files

| File | What it does |
| --- | --- |
| `common.py` | MinHash/LSH (bit-for-bit with `extension/src/checks/copy/minhash.ts`), URL normalization, article text extraction |
| `build_sitelist.py` | Validates and exports the site list, allowlist and AI-builder fingerprints |
| `build_fingerprints.py` | MinHash + LSH clustering of saved articles; checks parity against `extension/tests/fixtures/minhash_vector.json` (exit 2 on mismatch) |
| `fetch_model.py` | `Lynote/fakespot-ai-roberta-base-ai-text-detection-v1-browser` via `huggingface_hub` |
| `export_onnx.py` | Optimum export of `fakespot-ai/roberta-base-ai-text-detection-v1`, dynamic int8, output check vs PyTorch |
| `eval.py` | Layer A (Python port of `scorers/phrases.ts`, reads the same `phrases.json`) + layer B (onnxruntime + tokenizers on the same `onnx/model_quantized.onnx`) |

## Inputs

- `data/sites.csv`: `domain,reason,note`; reason is `farm` or `builder`. A domain may not also be on the allowlist (the script refuses).
- `data/allowlist.txt`: one domain per line, `#` comments. Parent-domain match in the extension.
- `data/builders.json`: `{ generators: [...lowercase substrings of <meta name=generator>], scriptHosts: [...] }`.
- `demo/pages/index.csv`: `file,url,cluster`. `cluster` is optional and FORCES pages with the same label
  into one copy cluster even if their text differs. The script prints whether each cluster is
  text-based or label-forced. Prefer leaving it empty and letting text similarity decide.

## Copy clustering

Article text = paragraphs, list items and headings inside `<article>`, `<main>` or `.entry-content`
(falls back to the whole page). Pages link when LSH (32 bands x 4 rows) makes them candidates
and their signature similarity is >= 0.5 (`--threshold`). For every page in a cluster of size > 1,
all 32 of its band keys go into `copies.json` with the cluster size, and its normalized URL goes into
`copy_urls.json`. The extension's page check flags a page when any of its band keys hits.

## Eval data format

`eval/data/*.jsonl` (gitignored), one object per line:

```json
{"text": "80-250 word chunk", "label": "human", "source": "seriouseats.com", "page": "seriouseats-grinders-2019"}
```

`page` groups chunks into pages for the page-level false alarm rate. The page rule mirrors
`extension/src/checks/text/index.ts`: chunks with >= `minWords` words, layer A >= `passThreshold`,
top `maxChunks` by layer A go to layer B, outline when >= `minFlaggedChunks` reach `layerB.threshold`.
Thresholds are read from `extension/src/config/detectors.config.ts`. Python layer A was checked
against the TS scorer on 792 paragraphs (0 mismatches).
