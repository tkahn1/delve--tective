// Shadow DOM host helper: page CSS can't reach in, ours can't leak out.
import { ensureFonts } from './fonts';
import { BASE_CSS, PAGE_CSS } from './styles';

export interface ShadowHost {
  host: HTMLElement;
  root: ShadowRoot;
  remove(): void;
}

/** Create a detached host element with an open shadow root containing BASE_CSS + css. */
export function createShadowHost(css: string, hostStyle = ''): ShadowHost {
  void ensureFonts();
  const host = document.createElement('unslop-root');
  host.setAttribute('data-unslop-ui', '');
  if (hostStyle) host.setAttribute('style', hostStyle);
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = BASE_CSS + css;
  root.appendChild(style);
  return { host, root, remove: () => host.remove() };
}

/** Small DOM builder used by the UI modules. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'html') el.innerHTML = v; // only used for our own static SVG strings
    else el.setAttribute(k, v);
  }
  for (const c of children) if (c != null) el.append(c);
  return el;
}

let pageStyleEl: HTMLStyleElement | null = null;

/** Page-level stylesheet used to restyle Google's own result elements (dim / hide). */
export function ensurePageStyle(): void {
  if (pageStyleEl?.isConnected) return;
  pageStyleEl = document.createElement('style');
  pageStyleEl.setAttribute('data-unslop-ui', '');
  pageStyleEl.textContent = PAGE_CSS;
  (document.head || document.documentElement).appendChild(pageStyleEl);
}

export function removePageStyle(): void {
  pageStyleEl?.remove();
  pageStyleEl = null;
}
