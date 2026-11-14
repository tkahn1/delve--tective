// Google search-results adapter. Robust to the live DOM and to saved copies of it.
import { registrableDomain } from '../../util/domain';

export interface ResultEl {
  container: HTMLElement;
  titleEl: HTMLElement;
  linkEl: HTMLAnchorElement;
  snippetEl: HTMLElement | null;
  citeEl: HTMLElement | null;
  url: string;
  title: string;
  domain: string;
}

const SKIP = [
  '#tads', '#tadsb', '#bottomads', '[data-text-ad]', '.commercial-unit-desktop-top', '.uEierd',
  '[aria-label="Ads"]', '[aria-label="Sponsored"]',
  '.related-question-pair', 'g-scrolling-carousel', 'g-section-with-header', '[data-initq]',
  'unslop-root', '[data-unslop-ui]',
].join(',');

const SNIPPET = '.VwiC3b, [data-sncf], [data-content-feature="1"], .IsZvec, [style*="-webkit-line-clamp"]';

function realUrl(a: HTMLAnchorElement): string | null {
  let href = a.getAttribute('href') ?? '';
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return null;
  let u: URL;
  try {
    u = new URL(href, a.ownerDocument.baseURI);
  } catch {
    return null;
  }
  // Redirect wrapper: /url?q=<target> (also in saved pages).
  if (u.pathname === '/url') {
    const t = u.searchParams.get('q') || u.searchParams.get('url');
    if (!t) return null;
    try {
      u = new URL(t);
    } catch {
      return null;
    }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (/(^|\.)google\.[a-z.]+$/i.test(u.hostname) || u.hostname.endsWith('googleusercontent.com')) return null;
  href = u.href;
  return href;
}

function containerFor(a: HTMLAnchorElement, root: Element): HTMLElement {
  const known = a.closest<HTMLElement>('.MjjYud') ?? a.closest<HTMLElement>('.g');
  if (known && root.contains(known)) return known;
  // Generic fallback: climb while the parent still holds only this one title.
  let el: HTMLElement = a;
  while (el.parentElement && el.parentElement !== root && el.parentElement.querySelectorAll('h3').length <= 1) {
    el = el.parentElement;
  }
  return el;
}

function titleAnchors(root: Element): HTMLAnchorElement[] {
  let anchors: HTMLAnchorElement[] = [];
  try {
    anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('a:has(h3)'));
  } catch {
    /* :has unsupported */
  }
  if (!anchors.length) {
    const seen = new Set<HTMLAnchorElement>();
    for (const h3 of Array.from(root.querySelectorAll('h3'))) {
      const a = h3.closest('a');
      if (a && !seen.has(a)) {
        seen.add(a);
        anchors.push(a);
      }
    }
  }
  return anchors;
}

export function findResults(doc: Document = document): ResultEl[] {
  const root = doc.querySelector('#rso') ?? doc.querySelector('#search') ?? doc.body;
  if (!root) return [];
  const out: ResultEl[] = [];
  const containers = new Set<HTMLElement>();
  const urls = new Set<string>();
  for (const a of titleAnchors(root)) {
    if (a.closest(SKIP)) continue;
    const h3 = a.querySelector('h3');
    if (!h3) continue;
    const url = realUrl(a);
    if (!url) continue;
    const container = containerFor(a, root);
    // Sub-links (sitelinks) share their parent's container; first anchor wins.
    if (containers.has(container) || urls.has(url)) continue;
    const title = (h3.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!title) continue;
    let domain = '';
    try {
      domain = registrableDomain(new URL(url).hostname);
    } catch {
      continue;
    }
    containers.add(container);
    urls.add(url);
    const snippetEl = container.querySelector<HTMLElement>(SNIPPET);
    out.push({
      container,
      titleEl: h3,
      linkEl: a,
      snippetEl: snippetEl && !snippetEl.contains(h3) ? snippetEl : null,
      citeEl: container.querySelector<HTMLElement>('cite'),
      url,
      title,
      domain,
    });
  }
  return out;
}
