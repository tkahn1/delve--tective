// Bloom filter lookup for the junk-site list. MUST match pipeline/bloom.py exactly
// (FNV-1a 32-bit, two bases, double hashing; little-endian bits within bytes; base64).
export interface BloomFilter {
  m: number;
  k: number;
  n: number;
  fpRate: number;
  bits: string; // base64
}

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const ALT_OFFSET = (FNV_OFFSET ^ 0x5bd1e995) >>> 0;
const encoder = new TextEncoder();

function fnv1a(data: Uint8Array, basis: number): number {
  let h = basis >>> 0;
  for (const b of data) {
    h ^= b;
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

export function bloomIndexes(item: string, m: number, k: number): number[] {
  const data = encoder.encode(item);
  const h1 = fnv1a(data, FNV_OFFSET);
  const h2 = (fnv1a(data, ALT_OFFSET) | 1) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < k; i++) out.push((h1 + i * h2) % m); // < 2^37, exact in a double
  return out;
}

/** Decode once, then test membership quickly. */
export function loadBloom(f: BloomFilter): (item: string) => boolean {
  const raw = atob(f.bits);
  const bits = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bits[i] = raw.charCodeAt(i);
  return (item: string) => bloomIndexes(item, f.m, f.k).every((i) => (bits[i >> 3] & (1 << (i & 7))) !== 0);
}
