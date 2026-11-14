import { describe, expect, it } from 'vitest';
import { combine, levelAtLeast } from '../src/combine/combine';
import type { Evidence } from '../src/checks/types';

const ev = (checkId: string, score: number, extra: Partial<Evidence> = {}): Evidence => ({
  checkId,
  score,
  confidence: 'high',
  reasons: [],
  ...extra,
});

describe('combine', () => {
  it('returns null level with no evidence', () => {
    expect(combine([])).toEqual({ score: 0, level: null, segments: 0, reasons: [] });
  });

  it('returns null level when all evidence scores 0', () => {
    const c = combine([ev('siteList', 0), ev('copy', 0)]);
    expect(c.level).toBeNull();
    expect(c.segments).toBe(0);
  });

  it('site list alone is high (0.7)', () => {
    const c = combine([ev('siteList', 1, { reasons: [{ templateId: 'siteList.listed' }] })]);
    expect(c.score).toBeCloseTo(0.7);
    expect(c.level).toBe('high');
    expect(c.segments).toBe(4);
    expect(c.reasons).toEqual([{ templateId: 'siteList.listed' }]);
  });

  it('title near-duplicate alone is medium (0.6 * 0.7 = 0.42)', () => {
    const c = combine([ev('copy', 0.7)]);
    expect(c.score).toBeCloseTo(0.42);
    expect(c.level).toBe('medium');
    expect(c.segments).toBe(3);
  });

  it('caps the score at 1 and gives 5 segments', () => {
    const c = combine([ev('siteList', 1), ev('copy', 1)]);
    expect(c.score).toBe(1);
    expect(c.level).toBe('high');
    expect(c.segments).toBe(5);
  });

  it('low level segments split at 0.2', () => {
    expect(combine([ev('text', 0.2)]).segments).toBe(1); // 0.1
    expect(combine([ev('text', 0.6)]).segments).toBe(2); // 0.3
    expect(combine([ev('text', 0.6)]).level).toBe('low');
  });

  it('text layer A only uses the small weight', () => {
    const c = combine([ev('text', 1, { confidence: 'low' })]);
    expect(c.score).toBeCloseTo(0.15);
    expect(c.level).toBe('low');
    const withSpans = combine([
      ev('text', 1, { confidence: 'low', spans: [{ chunkIndex: 0, score: 0.95, reasons: [] }] }),
    ]);
    expect(withSpans.score).toBeCloseTo(0.5);
  });

  it('orders reasons by weighted contribution', () => {
    const c = combine([
      ev('copy', 0.7, { reasons: [{ templateId: 'copy.sameTitle', values: { n: 3 } }] }),
      ev('siteList', 1, { reasons: [{ templateId: 'siteList.listed' }] }),
    ]);
    expect(c.reasons.map((r) => r.templateId)).toEqual(['siteList.listed', 'copy.sameTitle']);
  });

  it('ignores unknown check ids', () => {
    expect(combine([ev('mystery', 1)]).score).toBe(0);
  });
});

describe('levelAtLeast', () => {
  it('compares levels', () => {
    expect(levelAtLeast('high', 'medium')).toBe(true);
    expect(levelAtLeast('medium', 'medium')).toBe(true);
    expect(levelAtLeast('low', 'medium')).toBe(false);
    expect(levelAtLeast(null, 'low')).toBe(false);
  });
});
