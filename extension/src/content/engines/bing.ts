// Bing (and Yahoo, below) search-results adapters. Same ResultEl shape as the Google adapter.
// TODO(hack): selectors from live pages seen 2026-11-14; no sponsored-result handling yet.
import { registrableDomain } from '../../util/domain';
import type { ResultEl } from './google';

/** "https://www.site.com › a › b" or "site.com/a/b" -> "https://www.site.com/" (host only; paths are often truncated). */
export function urlFromDisplay(text: string): string | null {
  const first = (text ?? '').replace(/\s+/g, ' ').trim().split(/[\s›]/)[0] ?? '';
  if (!first) return null;
  const withScheme = /^https?:\/\//i.test(first) ? first : `https://${first}`;
  try {
    const u = new URL(withScheme);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) return null;
    return `${u.protocol}//${u.hostname}/`;
  } catch {
    return null;
  }
}

/** Bing wraps result links as bing.com/ck/a?...&u=a1<base64url of target>. */
export function bingTarget(href: string): string | null {
  try {
    const u = new URL(href, 'https://www.bing.com');
    if (!/(^|\.)bing\.com$/i.test(u.hostname)) return /^https?:$/.test(u.protocol) ? u.href : null;
    const enc = u.searchParams.get('u');
    if (!enc || !enc.startsWith('a1')) return null;
    const b64 = enc.slice(2).replace(/-/g, '+').replace(/_/g, '/');
    const t = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    return /^https?:\/\//i.test(t) ? t : null;
  } catch {
    return null;
  }
}

export function makeResult(
  container: HTMLElement,
  linkEl: HTMLAnchorElement,
  titleEl: HTMLElement,
  url: string | null,
  citeEl: HTMLElement | null,
  snippetEl: HTMLElement | null,
): ResultEl | null {
  if (!url) return null;
  const title = (titleEl.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!title) return null;
  let domain = '';
  try {
    domain = registrableDomain(new URL(url).hostname);
  } catch {
    return null;
  }
  return { container, titleEl, linkEl, snippetEl, citeEl, url, title, domain };
}

export function findBingResults(doc: Document = document): ResultEl[] {
  const out: ResultEl[] = [];
  const seen = new Set<string>();
  for (const li of Array.from(doc.querySelectorAll<HTMLElement>('#b_results > li.b_algo'))) {
    const a = li.querySelector<HTMLAnchorElement>('h2 a[href]');
    if (!a) continue;
    const cite = li.querySelector<HTMLElement>('cite');
    const url = bingTarget(a.getAttribute('href') ?? '') ?? urlFromDisplay(cite?.textContent ?? '');
    const r = makeResult(li, a, a, url, cite, li.querySelector<HTMLElement>('.b_caption p, .b_lineclamp2, .b_lineclamp3'));
    if (r && !seen.has(r.url)) {
      seen.add(r.url);
      out.push(r);
    }
  }
  return out;
}

/** Yahoo (Bing-powered) wraps links as r.search.yahoo.com/.../RU=<encoded target>/RK=... */
export function yahooTarget(href: string): string | null {
  const m = href.match(/\/RU=([^/]+)\//);
  const raw = m ? decodeURIComponent(m[1]) : href;
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol) || /(^|\.)yahoo\.com$/i.test(u.hostname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

export function findYahooResults(doc: Document = document): ResultEl[] {
  const out: ResultEl[] = [];
  const seen = new Set<string>();
  for (const box of Array.from(doc.querySelectorAll<HTMLElement>('#web .algo'))) {
    if (box.closest('.ads, [data-matarget="ad"], #main .searchCenterTopAds, .searchCenterBottomAds')) continue;
    const a = box.querySelector<HTMLAnchorElement>('h3 a[href], .compTitle a[href]');
    if (!a) continue;
    const titleEl = a.querySelector<HTMLElement>('h3, span:last-child') ?? a;
    const cite = box.querySelector<HTMLElement>('.compTitle span, cite');
    const url = yahooTarget(a.href) ?? urlFromDisplay(cite?.textContent ?? '');
    const container = (box.closest('li') as HTMLElement | null) ?? box;
    const r = makeResult(container, a, titleEl, url, cite, box.querySelector<HTMLElement>('.compText p, .compText'));
    if (r && !seen.has(r.url)) {
      seen.add(r.url);
      out.push(r);
    }
  }
  return out;
}
