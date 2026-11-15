// Layer A (v2): logistic regression over hashed word/char n-grams + writing-style features.
// Trained offline by pipeline/lr/train.py; weights in src/data/layerA_lr.json.
// MUST stay identical to pipeline/lr/features.py: tests/lr.test.ts checks this file against
// tests/fixtures/lr_vectors.json (written by train.py). Change both together, then retrain.
import lists from '../lr_phrases.json';
import model from '../../../data/layerA_lr.json';
import type { TextScorer } from './types';

const N_HASH: number = model.nHash;

const ZW = /[​‌‍⁠﻿]/g;
const APOS = /[‘’ʼ′`]/g;
const QUOT = /[“”″]/g;
const DASH = /[‐‑‒–]/g;
const TOKEN = /[a-z0-9]+(?:['-][a-z0-9]+)*/g;
const SENT = /(?<=[.!?])\s+|\n+/;
const DIGIT = /[0-9]/;
const WORDCHAR = /[a-z0-9]/;

const FIRST_PERSON = new Set(['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours']);
const SECOND_PERSON = new Set(['you', 'your', 'yours']);

export function normalize(text: string): string {
  return text.replace(ZW, '').replace(APOS, "'").replace(QUOT, '"').replace(DASH, '-').replace(/ /g, ' ').toLowerCase();
}

export function tokens(norm: string): string[] {
  return norm.match(TOKEN) ?? [];
}

function sentences(norm: string): string[] {
  return norm.split(SENT).map((s) => s.trim()).filter((s) => s.length > 0);
}

function compile(entries: string[]): string[][] {
  return entries.map((e) => {
    const t = tokens(e.replace(/\*/g, ''));
    if (e.endsWith('*') && t.length) t[t.length - 1] += '*';
    return t;
  });
}

const CLICHE = compile(lists.cliche);
const ROUNDUP = compile(lists.roundup);
const LLMWORDS = compile(lists.llm_words);
const TRANSITIONS = lists.transitions.map(normalize);

const wordMatch = (pt: string, tok: string) => (pt.endsWith('*') ? tok.startsWith(pt.slice(0, -1)) : tok === pt);

function countPhrases(toks: string[], phrases: string[][]): number {
  let n = 0;
  for (let i = 0; i < toks.length; i++) {
    for (const p of phrases) {
      if (i + p.length > toks.length) continue;
      let ok = true;
      for (let j = 0; j < p.length; j++) {
        if (!wordMatch(p[j], toks[i + j])) { ok = false; break; }
      }
      if (ok) n++;
    }
  }
  return n;
}

function startsWithTransition(s: string): boolean {
  for (const t of TRANSITIONS) {
    if (s.startsWith(t) && (s.length === t.length || !WORDCHAR.test(s[t.length]))) return true;
  }
  return false;
}

const count = (s: string, ch: string) => s.split(ch).length - 1;

/** Dense style features, same order as model.denseNames / DENSE_NAMES in features.py. */
export function dense(text: string): number[] {
  const norm = normalize(text);
  const toks = tokens(norm);
  const n = toks.length;
  if (n === 0) return new Array(model.denseNames.length).fill(0);
  const per100 = 100 / n;
  const sents = sentences(norm);
  const lens = sents.map((s) => tokens(s).length).filter((x) => x > 0);
  let cv = 0.5;
  if (lens.length >= 3) {
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const v = lens.reduce((a, b) => a + (b - mean) * (b - mean), 0) / lens.length;
    cv = mean > 0 ? Math.sqrt(v) / mean : 0;
  }
  const meanLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : n;
  let trans = 0;
  for (const s of sents) if (startsWithTransition(s)) trans++;
  const head = toks.slice(0, 150);
  let digits = 0, first = 0, second = 0, chars = 0;
  for (const t of toks) {
    if (DIGIT.test(t)) digits++;
    if (FIRST_PERSON.has(t)) first++;
    if (SECOND_PERSON.has(t)) second++;
    chars += t.length;
  }
  return [
    countPhrases(toks, CLICHE) * per100,
    countPhrases(toks, ROUNDUP) * per100,
    countPhrases(toks, LLMWORDS) * per100,
    sents.length ? trans / sents.length : 0,
    cv,
    meanLen / 25,
    new Set(head).size / head.length,
    count(norm, '—') * per100,
    count(norm, ':') * per100,
    count(norm, '!') * per100,
    count(norm, '?') * per100,
    digits / n,
    first / n,
    second / n,
    chars / n / 10,
    count(norm, ',') / n,
  ];
}

/** MurmurHash3 x86_32, seed 0, over ASCII bytes (all grams are ASCII). Signed, like sklearn. */
function murmur3(s: string): number {
  const c1 = 0xcc9e2d51, c2 = 0x1b873593;
  const len = s.length;
  let h = 0;
  const nb = len & ~3;
  for (let i = 0; i < nb; i += 4) {
    let k = s.charCodeAt(i) | (s.charCodeAt(i + 1) << 8) | (s.charCodeAt(i + 2) << 16) | (s.charCodeAt(i + 3) << 24);
    k = Math.imul(k, c1); k = (k << 15) | (k >>> 17); k = Math.imul(k, c2);
    h ^= k; h = (h << 13) | (h >>> 19); h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }
  const rem = len & 3;
  if (rem > 0) {
    let k = 0;
    if (rem === 3) k ^= s.charCodeAt(nb + 2) << 16;
    if (rem >= 2) k ^= s.charCodeAt(nb + 1) << 8;
    k ^= s.charCodeAt(nb);
    k = Math.imul(k, c1); k = (k << 15) | (k >>> 17); k = Math.imul(k, c2); h ^= k;
  }
  h ^= len;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h | 0;
}

function bucket(g: string): number {
  const h = murmur3(g);
  return h === -2147483648 ? (2147483647 - (N_HASH - 1)) % N_HASH : Math.abs(h) % N_HASH;
}

/** Hashed n-gram row: log1p(count) per bucket, L2-normalised. */
export function hashedRow(text: string): Map<number, number> {
  const toks = tokens(normalize(text));
  const counts = new Map<number, number>();
  const add = (g: string) => {
    const b = bucket(g);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  };
  for (const t of toks) add('w ' + t);
  for (let i = 0; i + 1 < toks.length; i++) add('b ' + toks[i] + ' ' + toks[i + 1]);
  const s = ' ' + toks.join(' ') + ' ';
  for (let i = 0; i + 4 <= s.length; i++) add('c ' + s.slice(i, i + 4));
  let norm2 = 0;
  for (const [b, c] of counts) {
    const v = Math.log1p(c);
    counts.set(b, v);
    norm2 += v * v;
  }
  const inv = norm2 > 0 ? 1 / Math.sqrt(norm2) : 0;
  for (const [b, v] of counts) counts.set(b, v * inv);
  return counts;
}

let hashW: Int8Array | null = null;
function weights(): Int8Array {
  if (!hashW) {
    const bin = atob(model.hashW);
    hashW = new Int8Array(bin.length);
    for (let i = 0; i < bin.length; i++) hashW[i] = (bin.charCodeAt(i) << 24) >> 24;
  }
  return hashW;
}

/** Probability (0..1) that a chunk reads like mass-generated / AI text. */
export function scoreLayerALR(text: string): number {
  const w = weights();
  let z = model.bias;
  for (const [b, v] of hashedRow(text)) z += w[b] * model.hashScale * v;
  const d = dense(text);
  for (let j = 0; j < d.length; j++) z += model.denseW[j] * ((d[j] - model.denseMean[j]) / model.denseStd[j]);
  return 1 / (1 + Math.exp(-z));
}

/** Threshold chosen by train.py so ~humanPass of human chunks pass (on its test split). */
export const LR_THRESHOLD: number = model.threshold;

export const lrScorer: TextScorer = {
  id: 'layerA-lr',
  async score(chunks: string[]): Promise<number[]> {
    return chunks.map(scoreLayerALR);
  },
};
