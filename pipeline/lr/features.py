"""Layer A logistic regression features. MUST stay identical to
extension/src/checks/text/scorers/lr.ts (checked by extension/tests/lr.test.ts against
extension/tests/fixtures/lr_vectors.json, written by pipeline/lr/train.py).

Two parts per chunk:
  - hashed n-grams: word unigrams ("w x"), word bigrams ("b x y"), char 4-grams of the
    space-joined tokens ("c abcd"), hashed with MurmurHash3 x86_32 (seed 0) exactly as
    scikit-learn's FeatureHasher does, into N_HASH buckets; value = log1p(count), row L2-normalised.
  - DENSE writing-style features (order fixed, see DENSE_NAMES), standardised with the
    training mean/std stored in the model file.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.feature_extraction import FeatureHasher

ROOT = Path(__file__).resolve().parents[2]
LISTS = json.loads((ROOT / "extension" / "src" / "checks" / "text" / "lr_phrases.json").read_text(encoding="utf-8"))

N_HASH = 1 << 18

_ZW = re.compile("[​‌‍⁠﻿]")
_APOS = re.compile("[‘’ʼ′`]")
_QUOT = re.compile("[“”″]")
_DASH = re.compile("[‐‑‒–]")
_TOKEN = re.compile(r"[a-z0-9]+(?:['-][a-z0-9]+)*")
_SENT = re.compile(r"(?<=[.!?])\s+|\n+")
_DIGIT = re.compile(r"[0-9]")

FIRST_PERSON = {"i", "me", "my", "mine", "we", "us", "our", "ours"}
SECOND_PERSON = {"you", "your", "yours"}

DENSE_NAMES = [
    "cliche_per100", "roundup_per100", "llmword_per100", "transition_rate", "sentence_cv",
    "sentence_len", "ttr150", "emdash_per100", "colon_per100", "exclaim_per100",
    "question_per100", "digit_share", "first_person", "second_person", "token_len", "comma_per_word",
]


def normalize(text: str) -> str:
    t = _ZW.sub("", text)
    t = _APOS.sub("'", t)
    t = _QUOT.sub('"', t)
    t = _DASH.sub("-", t)
    t = t.replace(" ", " ")
    return t.lower()


def tokens(norm: str) -> list[str]:
    return _TOKEN.findall(norm)


def sentences(norm: str) -> list[str]:
    return [s.strip() for s in _SENT.split(norm) if s.strip()]


def _compile(entries: list[str]) -> list[list[str]]:
    return [tokens(e.replace("*", "")) [:-1] + [tokens(e.replace("*", ""))[-1] + "*"] if e.endswith("*") else tokens(e)
            for e in entries]


CLICHE = _compile(LISTS["cliche"])
ROUNDUP = _compile(LISTS["roundup"])
LLMWORDS = _compile(LISTS["llm_words"])
TRANSITIONS = [normalize(t) for t in LISTS["transitions"]]


def _word_match(pt: str, tok: str) -> bool:
    return tok.startswith(pt[:-1]) if pt.endswith("*") else tok == pt


def count_phrases(toks: list[str], phrases: list[list[str]]) -> int:
    n = 0
    for i in range(len(toks)):
        for p in phrases:
            if i + len(p) > len(toks):
                continue
            ok = True
            for j, pt in enumerate(p):
                if not _word_match(pt, toks[i + j]):
                    ok = False
                    break
            if ok:
                n += 1
    return n


def _starts_with_transition(s: str) -> bool:
    for t in TRANSITIONS:
        if s.startswith(t) and (len(s) == len(t) or not re.match(r"[a-z0-9]", s[len(t)])):
            return True
    return False


def dense(text: str) -> list[float]:
    norm = normalize(text)
    toks = tokens(norm)
    n = len(toks)
    if n == 0:
        return [0.0] * len(DENSE_NAMES)
    per100 = 100.0 / n
    sents = sentences(norm)
    lens = [len(tokens(s)) for s in sents]
    lens = [x for x in lens if x > 0]
    if len(lens) >= 3:
        mean = sum(lens) / len(lens)
        var = sum((x - mean) ** 2 for x in lens) / len(lens)
        cv = math.sqrt(var) / mean if mean > 0 else 0.0
    else:
        cv = 0.5
    mean_len = (sum(lens) / len(lens)) if lens else float(n)
    trans = sum(1 for s in sents if _starts_with_transition(s))
    head = toks[:150]
    return [
        count_phrases(toks, CLICHE) * per100,
        count_phrases(toks, ROUNDUP) * per100,
        count_phrases(toks, LLMWORDS) * per100,
        trans / len(sents) if sents else 0.0,
        cv,
        mean_len / 25.0,
        len(set(head)) / len(head),
        norm.count("—") * per100,
        norm.count(":") * per100,
        norm.count("!") * per100,
        norm.count("?") * per100,
        sum(1 for t in toks if _DIGIT.search(t)) / n,
        sum(1 for t in toks if t in FIRST_PERSON) / n,
        sum(1 for t in toks if t in SECOND_PERSON) / n,
        (sum(len(t) for t in toks) / n) / 10.0,
        norm.count(",") / n,
    ]


def grams(text: str) -> list[str]:
    toks = tokens(normalize(text))
    out = ["w " + t for t in toks]
    out += ["b " + toks[i] + " " + toks[i + 1] for i in range(len(toks) - 1)]
    s = " " + " ".join(toks) + " "
    out += ["c " + s[i:i + 4] for i in range(len(s) - 3)]
    return out


_hasher = FeatureHasher(n_features=N_HASH, input_type="string", alternate_sign=False)


def hashed(texts: list[str]):
    """Sparse matrix (len(texts) x N_HASH): log1p(count), L2-normalised rows."""
    from sklearn.preprocessing import normalize as l2
    X = _hasher.transform(grams(t) for t in texts).tocsr().astype(np.float64)
    X.data = np.log1p(X.data)
    return l2(X, norm="l2", copy=False)


def hashed_row(text: str) -> dict[int, float]:
    """One row as {index: value} (for test vectors)."""
    X = hashed([text])
    return {int(i): float(v) for i, v in zip(X.indices, X.data)}


if __name__ == "__main__":
    demo = "In today's fast-paced world, finding the perfect grinder is a game-changer. Moreover, it's ideal for beginners — truly."
    print(dict(zip(DENSE_NAMES, [round(x, 4) for x in dense(demo)])))
    print(len(grams(demo)), "grams;", Counter(g[0] for g in grams(demo)))
