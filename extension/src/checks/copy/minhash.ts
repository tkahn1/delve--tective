// MinHash + LSH. Pure TypeScript, no dependencies.
// MUST match pipeline/ (Python) bit-for-bit. See CONTRACT.md "MinHash spec".

export const NUM_HASHES = 128;
export const SHINGLE = 5;
export const BANDS = 32;
export const ROWS = 4;

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const encoder = new TextEncoder();

/** FNV-1a 32-bit over bytes, unsigned. */
export function fnv1aBytes(bytes: Uint8Array): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** FNV-1a 32-bit over the UTF-8 bytes of a string. */
export function fnv1a(s: string): number {
  return fnv1aBytes(encoder.encode(s));
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function shingles(tokens: string[], k = SHINGLE): string[] {
  const out: string[] = [];
  for (let i = 0; i + k <= tokens.length; i++) out.push(tokens.slice(i, i + k).join(' '));
  return out;
}

const SEEDS: Uint32Array = (() => {
  const s = new Uint32Array(NUM_HASHES);
  for (let i = 0; i < NUM_HASHES; i++) s[i] = Math.imul(i + 1, 0x9e3779b1) >>> 0;
  return s;
})();

function mix(x: number, seed: number): number {
  let h = (x ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** 128-slot MinHash signature. Returns null when the text has fewer than 5 tokens. */
export function signature(text: string): Uint32Array | null {
  const sh = shingles(tokenize(text));
  if (sh.length === 0) return null;
  const sig = new Uint32Array(NUM_HASHES).fill(0xffffffff);
  for (const s of sh) {
    const x = fnv1a(s);
    for (let i = 0; i < NUM_HASHES; i++) {
      const v = mix(x, SEEDS[i]);
      if (v < sig[i]) sig[i] = v;
    }
  }
  return sig;
}

/** LSH band keys "<b>:<hex8>" (32 bands x 4 rows). */
export function bandKeys(sig: Uint32Array): string[] {
  const keys: string[] = [];
  const buf = new Uint8Array(ROWS * 4);
  const view = new DataView(buf.buffer);
  for (let b = 0; b < BANDS; b++) {
    for (let r = 0; r < ROWS; r++) view.setUint32(r * 4, sig[b * ROWS + r], true);
    keys.push(`${b}:${fnv1aBytes(buf).toString(16).padStart(8, '0')}`);
  }
  return keys;
}

/** Fraction of equal signature slots. */
export function similarity(a: Uint32Array, b: Uint32Array): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let eq = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) eq++;
  return eq / n;
}
