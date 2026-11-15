// Groups comments that are copies or near-copies of each other. Pure logic: runs in the service worker
// (and in tests). Measured on an 11,185-comment video: ~240 ms per quick pass (maxDf 100), ~700 ms full.
import type { CopyGroup, CopyKind, GroupOptions, VideoComment } from './types';

const STOP = new Set(
  ('the a an and or but of to in on at for with is are was were be been it this that i you he she we they my your ' +
    'his her our their me him them so just not no yes do does did have has had what when who how why if then than ' +
    'as from by like all im its dont can will would').split(' '),
);

export function normalize(text: string): string {
  return (text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/@[\w.-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Names that look promoted: letters mixed with digits (ams39k), or $TICKER. */
export function campaignTokens(raw: string): Set<string> {
  const out = new Set<string>();
  const re = /\$[A-Za-z]{2,10}\b|\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{4,12}\b/g;
  // Replies start with "@handle" of the person replied to: a handle with digits (@sethh1943) is not a promoted
  // name, and counting it chained every reply under a popular comment into one "campaign". Links neither.
  const text = (raw || '').replace(/https?:\/\/\S+/g, ' ').replace(/(^|\s)@[\w.\-]+/g, ' ');
  for (const m of text.matchAll(re)) {
    let t = m[0].toLowerCase();
    if (t.length > 4 && t.endsWith('s') && /\d/.test(t.slice(0, -1))) t = t.slice(0, -1); // AMS39Ks -> ams39k
    if (/^\d+(st|nd|rd|th|s|k|m|am|pm|p|fps)$/.test(t)) continue; // 1st, 90s, 10k, 1080p
    if (/^(19|20)\d\d$/.test(t)) continue; // years
    out.add(t);
  }
  return out;
}

function wordSet(norm: string): Set<string> {
  return new Set(norm.split(' ').filter((w) => w.length > 2 && !STOP.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const RANK: Record<CopyKind, number> = { exact: 1, near: 2, campaign: 3 };

export function groupComments(comments: VideoComment[], opts: GroupOptions = {}): CopyGroup[] {
  const minChars = opts.minChars ?? 12;
  const nearThreshold = opts.nearThreshold ?? 0.6;
  const nearMinWords = opts.nearMinWords ?? 5;
  const campaignMin = opts.campaignMin ?? 3;
  const n = comments.length;

  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const kindOf = new Map<number, CopyKind>();
  const labelOf = new Map<number, string>();
  // When two groups join, keep the strongest kind (campaign > near > exact) and its label from either side.
  const union = (a: number, b: number, kind: CopyKind, label?: string) => {
    const ra = find(a);
    const rb = find(b);
    const options: { k: CopyKind; l?: string }[] = [{ k: kind, l: label }];
    for (const r of [ra, rb]) {
      const k = kindOf.get(r);
      if (k) options.push({ k, l: labelOf.get(r) });
    }
    const best = options.reduce((x, y) => (RANK[y.k] > RANK[x.k] || (RANK[y.k] === RANK[x.k] && !x.l && y.l) ? y : x));
    if (ra !== rb) {
      parent[rb] = ra;
      kindOf.delete(rb);
      labelOf.delete(rb);
    }
    kindOf.set(ra, best.k);
    if (best.l) labelOf.set(ra, best.l);
    else labelOf.delete(ra);
  };

  const norms = comments.map((c) => normalize(c.text));
  const words = norms.map(wordSet);

  // 1. Exact copies after normalising.
  const byNorm = new Map<string, number>();
  norms.forEach((k, i) => {
    if (k.length < minChars) return;
    const first = byNorm.get(k);
    if (first !== undefined) union(first, i, 'exact');
    else byNorm.set(k, i);
  });

  // 2. Near copies. Index uncommon words (used by 2..maxDf comments). For each comment, count shared
  // uncommon words with every later comment in a flat array, then compare fully only when 2+ are shared.
  const df = new Map<string, number>();
  for (const ws of words) for (const w of ws) df.set(w, (df.get(w) ?? 0) + 1);
  const maxDf = Math.min(opts.maxDf ?? Infinity, Math.max(3, Math.floor(n * 0.03)));
  const index = new Map<string, number[]>();
  const eligible = words.map((ws, i) => norms[i].length >= minChars && ws.size >= nearMinWords); // short comments agree by chance
  words.forEach((ws, i) => {
    if (!eligible[i]) return;
    for (const w of ws) {
      const d = df.get(w)!;
      if (d < 2 || d > maxDf) continue;
      let list = index.get(w);
      if (!list) index.set(w, (list = []));
      list.push(i); // ascending, since i ascends
    }
  });
  const shared = new Int32Array(n);
  const touched: number[] = [];
  for (let a = 0; a < n; a++) {
    if (!eligible[a]) continue;
    for (const w of words[a]) {
      const list = index.get(w);
      if (!list) continue;
      for (let k = list.length - 1; k >= 0 && list[k] > a; k--) {
        const b = list[k];
        if (shared[b] === 0) touched.push(b);
        shared[b]++;
      }
    }
    for (const b of touched) {
      if (shared[b] >= 2 && find(a) !== find(b) && jaccard(words[a], words[b]) >= nearThreshold) union(a, b, 'near');
      shared[b] = 0;
    }
    touched.length = 0;
  }

  // 3. Campaigns: the same promoted name from several different accounts.
  const tokenUsers = new Map<string, number[]>();
  comments.forEach((c, i) => {
    for (const t of campaignTokens(c.text)) {
      let list = tokenUsers.get(t);
      if (!list) tokenUsers.set(t, (list = []));
      list.push(i);
    }
  });
  for (const [t, list] of tokenUsers) {
    if (list.length < campaignMin) continue;
    if (new Set(list.map((i) => comments[i].author)).size < campaignMin) continue;
    if (n >= 50 && list.length > n * 0.2) continue; // on bigger videos, a name in >20% of comments is the topic
    for (let k = 1; k < list.length; k++) union(list[0], list[k], 'campaign', t.toUpperCase());
  }

  const members = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    let m = members.get(r);
    if (!m) members.set(r, (m = []));
    m.push(i);
  }
  const groups: CopyGroup[] = [];
  for (const [r, idx] of members) {
    if (idx.length < 2) continue;
    groups.push({
      kind: kindOf.get(r) ?? 'near',
      label: labelOf.get(r) ?? null,
      ids: idx.map((i) => comments[i].id),
      authors: new Set(idx.map((i) => comments[i].author)).size,
    });
  }
  groups.sort((a, b) => b.ids.length - a.ids.length);
  return groups;
}
