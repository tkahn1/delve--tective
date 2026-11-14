// Near-identical titles within one search results page.
// Strip the search words (and simple plural variants), months, years, punctuation and stopwords;
// if the leftover wording is shared by enough distinct non-allowlisted domains, flag.

const MONTHS = new Set([
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
]);

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'for', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'is', 'are',
  'was', 'were', 'be', 'it', 'its', 'this', 'that', 'these', 'those', 'your', 'you', 'our', 'we', 'my', 'i', 'vs', 'v',
  'how', 'what', 'which', 'why', 'who', 'when', 'where', 'do', 'does', 'can', 'will', 'all', 'any', 'into', 'about',
  'up', 'out', 'so', 'than', 'then', 'there', 'their', 'if', 'not', 'no', 'per', 's',
]);

const YEAR = /^(19|20)\d\d$/;

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter(Boolean);
}

/** Query words plus simple plural/singular variants. */
export function queryVariants(query: string | undefined): Set<string> {
  const out = new Set<string>();
  for (const w of words(query ?? '')) {
    out.add(w);
    out.add(w + 's');
    out.add(w + 'es');
    if (w.endsWith('s')) out.add(w.slice(0, -1));
    if (w.endsWith('es')) out.add(w.slice(0, -2));
    if (w.endsWith('y')) out.add(w.slice(0, -1) + 'ies');
    if (w.endsWith('ies')) out.add(w.slice(0, -3) + 'y');
  }
  return out;
}

/** Leftover wording of a title after stripping query words, dates, punctuation and stopwords. */
export function titleLeftover(title: string, query: string | undefined, qv = queryVariants(query)): string[] {
  return words(title).filter((w) => !qv.has(w) && !MONTHS.has(w) && !YEAR.test(w) && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

export interface TitleMatch { n: number; leftover: string; }

/**
 * Returns the number of OTHER distinct domains on the page sharing this result's leftover wording,
 * or null if below thresholds.
 */
export function sameTitleMatch(
  self: { title: string; domain: string },
  siblings: { title: string; domain: string }[],
  query: string | undefined,
  opts: { minLeftoverWords: number; minTitleDomains: number; isAllowlisted: (d: string) => boolean },
): TitleMatch | null {
  if (opts.isAllowlisted(self.domain)) return null;
  const qv = queryVariants(query);
  const mine = titleLeftover(self.title, query, qv);
  if (mine.length < opts.minLeftoverWords) return null;
  const key = mine.join(' ');
  const domains = new Set<string>([self.domain]);
  for (const s of siblings) {
    if (!s.domain || domains.has(s.domain) || opts.isAllowlisted(s.domain)) continue;
    if (titleLeftover(s.title, query, qv).join(' ') === key) domains.add(s.domain);
  }
  if (domains.size < opts.minTitleDomains) return null;
  return { n: domains.size - 1, leftover: key };
}
