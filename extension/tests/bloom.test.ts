import { describe, expect, it } from 'vitest';
import bloomData from '../src/data/sites_bloom.json';
import sites from '../src/data/sites.json';
import { bloomIndexes, loadBloom, type BloomFilter } from '../src/util/bloom';

const farm = (bloomData as { filters: { farm: BloomFilter } }).filters.farm;
const has = loadBloom(farm);

describe('site-list Bloom filter', () => {
  it('contains every listed farm domain (no false negatives)', () => {
    const farms = Object.entries(sites as Record<string, string>).filter(([, r]) => r === 'farm').map(([d]) => d);
    expect(farms.length).toBe(farm.n);
    for (const d of farms) expect(has(d)).toBe(true);
  });
  it('rejects ordinary domains (false positives stay rare)', () => {
    const probes = Array.from({ length: 20000 }, (_, i) => `not-listed-${i}.example`);
    const fp = probes.filter((d) => has(d)).length;
    expect(fp).toBeLessThan(5); // expected ~0.2 at 1e-5
    for (const d of ['wikipedia.org', 'nytimes.com', 'github.com', 'bing.com']) expect(has(d)).toBe(false);
  });
  it('matches the Python hashing (fixed vector)', () => {
    expect(bloomIndexes('example.com', 1000, 3)).toEqual(PY_VECTOR);
  });
});

// From pipeline/bloom.py: bloom.indexes("example.com", 1000, 3)
const PY_VECTOR = [678, 475, 272];
