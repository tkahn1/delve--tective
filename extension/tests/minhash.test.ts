import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fnv1a, tokenize, shingles, signature, bandKeys, similarity } from '../src/checks/copy/minhash';

const here = dirname(fileURLToPath(import.meta.url));
const VECTOR_PATH = resolve(here, 'fixtures/minhash_vector.json');

const VECTOR_TEXT =
  'The quick brown fox jumps over the lazy dog, and then the fox runs back into the forest to find its den before nightfall.';

const ARTICLE =
  'A good burr grinder is the single biggest upgrade you can make to your home coffee setup. ' +
  'Blade grinders chop beans unevenly, which leads to bitter and sour flavors in the same cup. ' +
  'Burr grinders crush the beans between two plates, giving a consistent particle size that extracts evenly. ' +
  'When choosing a grinder, look at the range of grind settings, the build quality, and how easy it is to clean.';

describe('fnv1a', () => {
  it('matches published FNV-1a 32 vectors', () => {
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
    expect(fnv1a('foobar')).toBe(0xbf9cf968);
  });
});

describe('tokenize / shingles', () => {
  it('lowercases and splits on non [a-z0-9]', () => {
    expect(tokenize('Hello, World! It’s 2026 café')).toEqual(['hello', 'world', 'it', 's', '2026', 'caf']);
  });
  it('no shingles under 5 tokens', () => {
    expect(shingles(['a', 'b', 'c', 'd'])).toEqual([]);
    expect(signature('one two three four')).toBeNull();
    expect(shingles(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['a b c d e', 'b c d e f']);
  });
});

describe('signature + LSH', () => {
  it('has 128 slots and 32 band keys', () => {
    const sig = signature(ARTICLE)!;
    expect(sig.length).toBe(128);
    const keys = bandKeys(sig);
    expect(keys.length).toBe(32);
    for (const k of keys) expect(k).toMatch(/^\d{1,2}:[0-9a-f]{8}$/);
  });

  it('identical text (modulo case/punctuation) gives identical signature', () => {
    const a = signature(ARTICLE)!;
    const b = signature(ARTICLE.toUpperCase().replace(/\./g, '!!'))!;
    expect(similarity(a, b)).toBe(1);
  });

  it('lightly edited copy is similar and shares band keys', () => {
    const edited = ARTICLE.replace('home coffee setup', 'kitchen coffee setup');
    const a = signature(ARTICLE)!;
    const b = signature(edited)!;
    expect(similarity(a, b)).toBeGreaterThan(0.6);
    const ka = new Set(bandKeys(a));
    expect(bandKeys(b).some((k) => ka.has(k))).toBe(true);
  });

  it('unrelated text is dissimilar and shares no band keys', () => {
    const other =
      'The city council voted on Tuesday to extend the bike lane network along the river, citing a rise in commuters. ' +
      'Opponents argued that parking spaces would be lost, while supporters pointed to fewer accidents on the corridor.';
    const a = signature(ARTICLE)!;
    const b = signature(other)!;
    expect(similarity(a, b)).toBeLessThan(0.1);
    const ka = new Set(bandKeys(a));
    expect(bandKeys(b).some((k) => ka.has(k))).toBe(false);
  });
});

describe('parity test vector', () => {
  it('matches tests/fixtures/minhash_vector.json (written on first run)', () => {
    const sig = signature(VECTOR_TEXT)!;
    const vector = {
      text: VECTOR_TEXT,
      tokens: tokenize(VECTOR_TEXT),
      shingleHashes: shingles(tokenize(VECTOR_TEXT)).map((s) => fnv1a(s)),
      signature: Array.from(sig),
      bandKeys: bandKeys(sig),
    };
    if (!existsSync(VECTOR_PATH)) {
      mkdirSync(dirname(VECTOR_PATH), { recursive: true });
      writeFileSync(VECTOR_PATH, JSON.stringify(vector, null, 2) + '\n');
    }
    const stored = JSON.parse(readFileSync(VECTOR_PATH, 'utf8'));
    expect(vector).toEqual(stored);
  });
});
