"""Bloom filter for the junk-site list. MUST match extension/src/util/bloom.ts exactly.

Hash: FNV-1a 32-bit over the UTF-8 domain, two variants (standard offset basis, and the basis
XOR 0x5bd1e995), combined by double hashing: index_i = (h1 + i * h2) mod m, i = 0..k-1.
Bits are stored little-endian within bytes (bit j of byte b = index 8*b + j), base64-encoded.
"""
from __future__ import annotations

import base64
import math

FNV_OFFSET = 0x811C9DC5
FNV_PRIME = 0x01000193
ALT_OFFSET = FNV_OFFSET ^ 0x5BD1E995


def fnv1a(data: bytes, basis: int) -> int:
    h = basis
    for b in data:
        h ^= b
        h = (h * FNV_PRIME) & 0xFFFFFFFF
    return h


def indexes(item: str, m: int, k: int) -> list[int]:
    data = item.encode("utf-8")
    h1 = fnv1a(data, FNV_OFFSET)
    h2 = fnv1a(data, ALT_OFFSET) | 1  # odd, so the k probes differ
    return [(h1 + i * h2) % m for i in range(k)]


def build(items: list[str], fp_rate: float = 1e-5) -> dict:
    n = max(1, len(items))
    m = max(64, math.ceil(-n * math.log(fp_rate) / (math.log(2) ** 2)))
    k = max(1, round(m / n * math.log(2)))
    bits = bytearray((m + 7) // 8)
    for it in items:
        for idx in indexes(it, m, k):
            bits[idx >> 3] |= 1 << (idx & 7)
    return {"m": m, "k": k, "n": len(items), "fpRate": fp_rate, "bits": base64.b64encode(bytes(bits)).decode()}


def contains(f: dict, item: str) -> bool:
    bits = base64.b64decode(f["bits"])
    return all(bits[i >> 3] & (1 << (i & 7)) for i in indexes(item, f["m"], f["k"]))
