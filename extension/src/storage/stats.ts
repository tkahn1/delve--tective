// Weekly report counters in chrome.storage.local key 'stats'. Written ONLY by the service worker.
// Domains and counts only, never URLs or text.
import type { Level, TemplateId } from '../checks/types';

export interface DomainStats {
  count: number;
  reasons: Record<string, number>;
}

export interface DayStats {
  dimmed: number;
  pagesFlagged: number;
  pagesHigh: number;
  paragraphs: number;
  /** Repeated comments flagged on YouTube videos / Reddit threads (older days lack it). */
  comments?: number;
  reasons: Record<TemplateId, number>;
  domains: Record<string, DomainStats>;
}

export interface Stats {
  days: Record<string, DayStats>; // 'YYYY-MM-DD' (local time)
}

export type StatsRange = 'week' | 'month' | 'all';

export interface StatsSummary {
  totals: { dimmed: number; pagesHigh: number; paragraphs: number; pagesFlagged: number; comments: number };
  daily: { label: string; value: number }[];
  topDomains: { domain: string; count: number; reason: TemplateId }[];
  reasons: { templateId: TemplateId; count: number }[];
}

const KEY = 'stats';
const TEMPLATE_IDS: TemplateId[] = [
  'siteList.listed',
  'siteList.builder',
  'copy.sameArticle',
  'copy.sameTitle',
  'text.page',
  'text.chunk',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------- date helpers (local time) ----------

const pad = (n: number) => String(n).padStart(2, '0');
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d: Date): Date {
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dow);
}

export function emptyDay(): DayStats {
  return {
    dimmed: 0,
    pagesFlagged: 0,
    pagesHigh: 0,
    paragraphs: 0,
    comments: 0,
    reasons: Object.fromEntries(TEMPLATE_IDS.map((t) => [t, 0])) as Record<TemplateId, number>,
    domains: {},
  };
}

// ---------- pure mutators (exported for tests) ----------

function bumpDomain(day: DayStats, domain: string, templateIds: TemplateId[]): void {
  if (!domain) return;
  const d = (day.domains[domain] ??= { count: 0, reasons: {} });
  d.count += 1;
  for (const t of templateIds) d.reasons[t] = (d.reasons[t] ?? 0) + 1;
}

export function applyResults(
  stats: Stats,
  items: { domain: string; templateIds: TemplateId[] }[],
  now: Date = new Date(),
): Stats {
  if (!items.length) return stats;
  const day = (stats.days[dayKey(now)] ??= emptyDay());
  for (const it of items) {
    day.dimmed += 1;
    for (const t of new Set(it.templateIds)) day.reasons[t] = (day.reasons[t] ?? 0) + 1;
    bumpDomain(day, it.domain, it.templateIds);
  }
  return stats;
}

export function applyPage(
  stats: Stats,
  page: { domain: string; level: Level | null; paragraphs: number; templateIds: TemplateId[] },
  now: Date = new Date(),
): Stats {
  const flagged = page.level === 'medium' || page.level === 'high' || page.paragraphs > 0;
  if (!flagged) return stats;
  const day = (stats.days[dayKey(now)] ??= emptyDay());
  day.pagesFlagged += 1;
  if (page.level === 'high') day.pagesHigh += 1;
  day.paragraphs += Math.max(0, page.paragraphs | 0);
  for (const t of new Set(page.templateIds)) day.reasons[t] = (day.reasons[t] ?? 0) + 1;
  bumpDomain(day, page.domain, page.templateIds);
  return stats;
}

/** A video or thread with repeated comments: counts the comments, and the page as flagged. */
export function applyComments(stats: Stats, page: { comments: number }, now: Date = new Date()): Stats {
  if (page.comments <= 0) return stats;
  const day = (stats.days[dayKey(now)] ??= emptyDay());
  day.comments = (day.comments ?? 0) + page.comments;
  day.pagesFlagged += 1;
  return stats;
}

// ---------- storage ----------

let queue: Promise<unknown> = Promise.resolve();
/** Serialize read-modify-write so concurrent messages don't lose counts. */
function update(fn: (s: Stats) => Stats): Promise<Stats> {
  const next = queue.then(async () => {
    const s = await getStats();
    const out = fn(s);
    await chrome.storage.local.set({ [KEY]: out });
    return out;
  });
  queue = next.catch(() => undefined);
  return next;
}

export async function getStats(): Promise<Stats> {
  const got = await chrome.storage.local.get(KEY);
  const s = got?.[KEY] as Stats | undefined;
  return s && s.days ? s : { days: {} };
}

export function recordResults(items: { domain: string; templateIds: TemplateId[] }[]): Promise<Stats> {
  if (!items.length) return getStats();
  return update((s) => applyResults(s, items));
}

export function recordPage(page: {
  domain: string;
  level: Level | null;
  paragraphs: number;
  templateIds: TemplateId[];
}): Promise<Stats> {
  return update((s) => applyPage(s, page));
}

export function recordComments(page: { comments: number }): Promise<Stats> {
  return update((s) => applyComments(s, page));
}

// ---------- summary ----------

function sumDays(stats: Stats, from: Date | null, to: Date): DayStats[] {
  const fromKey = from ? dayKey(from) : '';
  const toKey = dayKey(to);
  return Object.entries(stats.days)
    .filter(([k]) => k >= fromKey && k <= toKey)
    .map(([, v]) => v);
}

export function summarize(stats: Stats, range: StatsRange, now: Date = new Date()): StatsSummary {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = startOfWeek(today);
  let from: Date | null;
  let daily: { label: string; value: number }[];

  const dimmedOn = (d: Date) => stats.days[dayKey(d)]?.dimmed ?? 0;
  const weekBuckets = (start: Date) => {
    const out: { label: string; value: number }[] = [];
    for (let w = start; w <= thisWeek; w = addDays(w, 7)) {
      let v = 0;
      for (let i = 0; i < 7; i++) v += dimmedOn(addDays(w, i));
      out.push({ label: `${MONTHS[w.getMonth()]} ${w.getDate()}`, value: v });
    }
    return out;
  };

  if (range === 'week') {
    from = thisWeek;
    daily = WEEKDAYS.map((label, i) => ({ label, value: dimmedOn(addDays(thisWeek, i)) }));
  } else if (range === 'month') {
    from = addDays(today, -29);
    daily = weekBuckets(startOfWeek(from));
  } else {
    from = null;
    const keys = Object.keys(stats.days).sort();
    const first = keys.length ? parseKey(keys[0]) : today;
    let start = startOfWeek(first);
    // Show at least 4 weeks so the chart isn't a single bar.
    const minStart = addDays(thisWeek, -21);
    if (start > minStart) start = minStart;
    daily = weekBuckets(start);
  }

  const days = sumDays(stats, from, range === 'week' ? addDays(thisWeek, 6) : today);
  const totals = { dimmed: 0, pagesHigh: 0, paragraphs: 0, pagesFlagged: 0, comments: 0 };
  const reasonCounts: Record<string, number> = {};
  const domains: Record<string, DomainStats> = {};
  for (const d of days) {
    totals.dimmed += d.dimmed;
    totals.pagesHigh += d.pagesHigh;
    totals.paragraphs += d.paragraphs;
    totals.pagesFlagged += d.pagesFlagged;
    totals.comments += d.comments ?? 0;
    for (const [t, n] of Object.entries(d.reasons)) reasonCounts[t] = (reasonCounts[t] ?? 0) + n;
    for (const [dom, ds] of Object.entries(d.domains)) {
      const acc = (domains[dom] ??= { count: 0, reasons: {} });
      acc.count += ds.count;
      for (const [t, n] of Object.entries(ds.reasons)) acc.reasons[t] = (acc.reasons[t] ?? 0) + n;
    }
  }

  const topDomains = Object.entries(domains)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([domain, ds]) => {
      const top = Object.entries(ds.reasons).sort((a, b) => b[1] - a[1])[0];
      return { domain, count: ds.count, reason: (top?.[0] ?? 'siteList.listed') as TemplateId };
    });

  const reasons = TEMPLATE_IDS.map((templateId) => ({ templateId, count: reasonCounts[templateId] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return { totals, daily, topDomains, reasons };
}
