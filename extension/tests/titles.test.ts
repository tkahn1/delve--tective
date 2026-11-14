import { describe, it, expect } from 'vitest';
import { titleLeftover, sameTitleMatch } from '../src/checks/copy/titles';
import { isAllowlisted } from '../src/util/domain';

const opts = { minLeftoverWords: 2, minTitleDomains: 3, isAllowlisted };
const Q = 'best coffee grinder 2026';

describe('titleLeftover', () => {
  it('strips query words, plurals, months, years, brackets and stopwords', () => {
    expect(titleLeftover('Best Coffee Grinder 2026 (November 2026) Trusted Reviews', Q).join(' ')).toBe('trusted reviews');
    expect(titleLeftover('The best coffee grinders (November 2026) Trusted Reviews', Q).join(' ')).toBe('trusted reviews');
    expect(titleLeftover('[Updated Nov 2025] Best Coffee Grinders | Trusted Reviews', Q).join(' ')).toBe('updated trusted reviews');
  });
});

describe('sameTitleMatch', () => {
  it('flags 3+ unlisted domains sharing the leftover wording', () => {
    const siblings = [
      { title: 'Best Coffee Grinder 2026 (November 2026) Trusted Reviews', domain: 'mayfairfarms.com' },
      { title: 'The best coffee grinders (November 2026) Trusted Reviews', domain: 'peggyomara.com' },
      { title: 'Best Coffee Grinders 2026 - Trusted Reviews', domain: 'grinderhub.net' },
      { title: 'The Best Coffee Grinders of 2026 | Reviews by Wirecutter', domain: 'nytimes.com' },
    ];
    const m = sameTitleMatch(siblings[0], siblings, Q, opts);
    expect(m).not.toBeNull();
    expect(m!.n).toBe(2);
    expect(m!.leftover).toBe('trusted reviews');
    expect(sameTitleMatch(siblings[3], siblings, Q, opts)).toBeNull();
  });

  it('does not flag legit sites that share only the search words', () => {
    const siblings = [
      { title: 'The Best Coffee Grinders of 2026', domain: 'nytimes.com' },
      { title: 'Best Coffee Grinder 2026', domain: 'smallroaster.com' },
      { title: 'Best coffee grinders 2026', domain: 'beanblog.org' },
      { title: 'The 7 Best Coffee Grinders (2026)', domain: 'homebarista.com' },
      { title: 'Best Coffee Grinder 2026: Tested and Reviewed', domain: 'kitchengearlab.com' },
      { title: 'Best Coffee Grinders 2026 - Tested by Experts', domain: 'grindtest.io' },
    ];
    for (const s of siblings) expect(sameTitleMatch(s, siblings, Q, opts)).toBeNull();
  });

  it('needs at least minTitleDomains distinct domains (same domain twice counts once)', () => {
    const siblings = [
      { title: 'Best Coffee Grinder 2026 Trusted Reviews', domain: 'a-site.com' },
      { title: 'Best Coffee Grinders Trusted Reviews', domain: 'a-site.com' },
      { title: 'Coffee Grinder (October 2026) Trusted Reviews', domain: 'b-site.com' },
    ];
    expect(sameTitleMatch(siblings[0], siblings, Q, opts)).toBeNull();
  });

  it('ignores allowlisted siblings when counting', () => {
    const siblings = [
      { title: 'Best Coffee Grinder Trusted Reviews', domain: 'x-farm.com' },
      { title: 'Best Coffee Grinder Trusted Reviews', domain: 'y-farm.com' },
      { title: 'Best Coffee Grinder Trusted Reviews', domain: 'en.wikipedia.org' },
    ];
    expect(sameTitleMatch(siblings[0], siblings, Q, opts)).toBeNull();
  });

  it('is fast: 10 results x 100 pages under 50 ms', () => {
    const siblings = Array.from({ length: 10 }, (_, i) => ({
      title: `Best Coffee Grinder 2026 (November 2026) ${i % 3 ? 'Trusted Reviews' : 'Other Words'}`,
      domain: `site${i}.com`,
    }));
    const t0 = performance.now();
    for (let r = 0; r < 100; r++) for (const s of siblings) sameTitleMatch(s, siblings, Q, opts);
    expect(performance.now() - t0).toBeLessThan(50);
  });
});
