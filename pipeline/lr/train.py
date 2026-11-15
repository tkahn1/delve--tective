"""Train the layer A logistic regression, evaluate it against the current scorer, export it.

Fast by design (hackathon): one grouped train/test split (by site / RAID source), a tiny C sweep.
  - Features: pipeline/lr/features.py (hashed n-grams + dense style features).
  - Split: 75/25 by group, so test sites never appear in training.
  - Threshold: the test-set human-chunk score percentile giving --human-pass (default 25%).
Writes:
  extension/src/data/layerA_lr.json         model (int8-quantised hashed weights, dense weights, threshold)
  extension/tests/fixtures/lr_vectors.json  parity test vectors (dense features, hashed rows, scores)
  eval/RESULTS_layerA_lr.md                 evaluation summary
"""
from __future__ import annotations

import argparse
import base64
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

sys.path.insert(0, str(Path(__file__).resolve().parent))
import features as F  # noqa: E402

ROOT = F.ROOT
DATA = ROOT / "eval" / "data" / "lr" / "chunks.jsonl"
MODEL_OUT = ROOT / "extension" / "src" / "data" / "layerA_lr.json"
VEC_OUT = ROOT / "extension" / "tests" / "fixtures" / "lr_vectors.json"
REPORT = ROOT / "eval" / "RESULTS_layerA_lr.md"
sys.path.insert(0, str(ROOT / "pipeline"))


def old_layer_a(texts: list[str]) -> np.ndarray:
    """Current hand-weighted layer A, via the Python port in pipeline/eval.py."""
    import eval as E  # pipeline/eval.py
    la = E.LayerA()
    return np.array([la.score(t) for t in texts])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--human-pass", type=float, default=0.25)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--max-per-group", type=int, default=12, help="cap chunks per site so big sites don't dominate")
    a = ap.parse_args()
    rng = random.Random(a.seed)

    rows = [json.loads(l) for l in open(DATA, encoding="utf-8")]
    by_group: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_group[r["group"]].append(r)
    rows = []
    for g, rs in by_group.items():
        rng.shuffle(rs)
        rows += rs[: a.max_per_group]
    groups = sorted(by_group)
    rng.shuffle(groups)
    test_groups = set(groups[: len(groups) // 4])
    train = [r for r in rows if r["group"] not in test_groups]
    test = [r for r in rows if r["group"] in test_groups]
    print(f"train {len(train)} test {len(test)} chunks; groups {len(groups)}", flush=True)

    def mats(rs: list[dict]):
        texts = [r["text"] for r in rs]
        return F.hashed(texts), np.array([F.dense(t) for t in texts]), np.array([1 if r["label"] == "ai" else 0 for r in rs])

    Htr, Dtr, ytr = mats(train)
    Hte, Dte, yte = mats(test)
    mean, std = Dtr.mean(0), Dtr.std(0) + 1e-6
    Xtr = sp.hstack([Htr, sp.csr_matrix((Dtr - mean) / std)]).tocsr()
    Xte = sp.hstack([Hte, sp.csr_matrix((Dte - mean) / std)]).tocsr()

    best = None
    for C in (0.5, 2.0):
        m = LogisticRegression(C=C, max_iter=2000, solver="liblinear", class_weight="balanced")
        m.fit(Xtr, ytr)
        auc = roc_auc_score(yte, m.decision_function(Xte))
        print(f"C={C}: test AUC {auc:.4f}", flush=True)
        if best is None or auc > best[0]:
            best = (auc, C, m)
    auc, C, m = best
    z = m.decision_function(Xte)
    prob = 1 / (1 + np.exp(-z))

    human = prob[yte == 0]
    thr = float(np.quantile(human, 1 - a.human_pass))
    def recall_at(p, t, mask):
        return float((p[mask] >= t).mean()) if mask.any() else float("nan")

    src = np.array([r["source"] + "/" + r["kind"] + "/" + r["label"] for r in test])
    lines = [f"# Layer A logistic regression: evaluation", "",
             f"Train {len(train)} / test {len(test)} chunks, split by site/source ({len(test_groups)} test groups). C={C}.",
             f"Test AUC (all sources): **{auc:.3f}**.", "",
             f"Threshold for {int(a.human_pass*100)}% human pass: **{thr:.4f}** (probability).", "",
             "| Test slice | chunks | share passing threshold |", "|---|---|---|"]
    for s in sorted(set(src)):
        mask = src == s
        lines.append(f"| {s} | {int(mask.sum())} | {recall_at(prob, thr, mask):.1%} |")

    old = old_layer_a([r["text"] for r in test])
    if not np.isnan(old).all():
        old_auc = roc_auc_score(yte, old)
        othr = float(np.quantile(old[yte == 0], 1 - a.human_pass))
        lines += ["", f"Current hand-weighted layer A on the same test set: AUC **{old_auc:.3f}**; at its own "
                  f"{int(a.human_pass*100)}% human-pass threshold ({othr:.3f}) it passes "
                  f"{(old[yte == 1] >= othr).mean():.1%} of AI chunks vs **{(prob[yte == 1] >= thr).mean():.1%}** for the new model."]
    names = F.DENSE_NAMES
    dw = m.coef_[0][F.N_HASH:]
    lines += ["", "Style feature weights (standardised):", ""] + [f"- {n}: {w:+.3f}" for n, w in sorted(zip(names, dw), key=lambda x: -abs(x[1]))]
    lines += ["", "Caveats: AI labels for junk-site pages are site-level (some pages may be human-written); human text is a 2019 crawl, "
              "so topics and dates differ from 2026 AI pages; RAID gives AI news/books only (no human RAID rows in the parquet conversion)."]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))

    # Export: int8-quantised hashed weights.
    hw = m.coef_[0][: F.N_HASH]
    scale = float(np.abs(hw).max() / 127) or 1.0
    q = np.clip(np.round(hw / scale), -127, 127).astype(np.int8)
    model = {
        "version": 1, "nHash": F.N_HASH, "denseNames": names,
        "denseMean": [float(x) for x in mean], "denseStd": [float(x) for x in std],
        "denseW": [float(x) for x in dw], "bias": float(m.intercept_[0]),
        "hashScale": scale, "hashW": base64.b64encode(q.tobytes()).decode("ascii"),
        "threshold": thr, "humanPass": a.human_pass, "testAuc": auc,
    }
    MODEL_OUT.write_text(json.dumps(model), encoding="utf-8")

    # Parity vectors use the QUANTISED weights, exactly as the browser computes.
    hwq = q.astype(np.float64) * scale
    samples = [r["text"] for r in rng.sample(test, 12)] + [
        "In today's fast-paced world, finding the perfect grinder is a game-changer. Moreover, it's ideal for beginners — truly.",
        "Mine is four years old. The motor still runs but the hopper cracked, so I’d buy the cheaper one again!",
        "",
    ]
    vecs = []
    for t in samples:
        d = F.dense(t)
        row = F.hashed_row(t)
        zz = float(m.intercept_[0] + sum(hwq[i] * v for i, v in row.items()) + sum(w * (x - mu) / sd for w, x, mu, sd in zip(dw, d, mean, std)))
        vecs.append({"text": t, "dense": d, "hashed": {str(k): v for k, v in sorted(row.items())}, "prob": 1 / (1 + np.exp(-zz))})
    VEC_OUT.write_text(json.dumps(vecs, indent=1), encoding="utf-8")
    print(f"model -> {MODEL_OUT} ({MODEL_OUT.stat().st_size/1e3:.0f} kB); vectors -> {VEC_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
