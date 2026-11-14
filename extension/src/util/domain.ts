import allowlistData from '../data/allowlist.json';

// TODO(hack): small hand-picked list of 2-part public suffixes; swap for the full PSL later.
const TWO_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'org.nz', 'net.nz',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp',
  'co.in', 'net.in', 'org.in', 'gov.in',
  'co.za', 'org.za',
  'com.br', 'net.br', 'org.br',
  'com.mx', 'com.ar', 'com.co', 'com.tr', 'com.sg', 'com.my', 'com.ph', 'com.hk', 'com.tw', 'com.cn',
  'co.kr', 'or.kr', 'co.id', 'co.il', 'co.th',
]);

/** Registrable domain of a hostname, e.g. "www.foo.co.uk" -> "foo.co.uk". */
export function registrableDomain(hostname: string): string {
  let h = (hostname || '').trim().toLowerCase().replace(/\.$/, '');
  h = h.replace(/^www\d*\./, '');
  // IPs and single labels pass through.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.startsWith('[')) return h;
  const parts = h.split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (TWO_PART_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

const ALLOW = new Set((allowlistData as string[]).map((d) => d.toLowerCase()));

/** True when the domain or any parent domain is on the allowlist. */
export function isAllowlisted(domain: string): boolean {
  let d = (domain || '').toLowerCase().replace(/^www\./, '');
  while (d) {
    if (ALLOW.has(d)) return true;
    const i = d.indexOf('.');
    if (i < 0) break;
    d = d.slice(i + 1);
    if (!d.includes('.')) break; // don't match bare TLDs
  }
  return false;
}

/** Normalized URL key used by copy_urls.json: host without www + path without trailing slash + search, lowercase. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    return (host + path + u.search).toLowerCase();
  } catch {
    return (url || '').toLowerCase();
  }
}
