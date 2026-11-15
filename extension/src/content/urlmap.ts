// Saved-page URL map (demo): a saved copy opened from file:// or localhost stands in for its real URL.
import { config } from '../config/detectors.config';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function basename(pathname: string): string {
  const seg = pathname.split(/[\\/]/).filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/** Returns the mapped URL for saved demo pages, otherwise the real URL. */
export function resolveUrl(href: string = location.href): string {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return href;
  }
  const local = u.protocol === 'file:' || LOCAL_HOSTS.has(u.hostname);
  if (!local) return href;
  const name = basename(u.pathname);
  const mapped = config.urlMap[name] ?? config.urlMap[name.toLowerCase()];
  return mapped ?? href;
}

/** google.<tld>/search (also www.google.co.uk etc.). */
export function isGoogleSearch(url: string): boolean {
  try {
    const u = new URL(url);
    return /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(u.hostname) && u.pathname === '/search';
  } catch {
    return false;
  }
}

/** Which supported search engine's results page this is, if any. */
export type EngineId = 'google' | 'bing' | 'yahoo';
export function searchEngineOf(url: string): EngineId | null {
  if (isGoogleSearch(url)) return 'google';
  try {
    const u = new URL(url);
    if (/(^|\.)bing\.com$/i.test(u.hostname) && u.pathname === '/search') return 'bing';
    if (/^search\.yahoo\.com$/i.test(u.hostname) && u.pathname.startsWith('/search')) return 'yahoo';
  } catch {
    /* not a URL */
  }
  return null;
}

export function queryOf(url: string): string {
  try {
    const p = new URL(url).searchParams;
    return p.get('q') ?? p.get('p') ?? '';
  } catch {
    return '';
  }
}
