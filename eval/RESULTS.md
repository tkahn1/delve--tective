# Text check eval results

Not run yet.

Run `python pipeline/eval.py` after putting labeled chunks in `eval/data/*.jsonl`
(format in `pipeline/eval.py` and `pipeline/README.md`) and fetching the model
with `python pipeline/fetch_model.py`. Use `--layer-a-only` to run without the model.
The script overwrites this file.
