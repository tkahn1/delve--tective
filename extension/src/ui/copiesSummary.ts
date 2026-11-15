// Summary at the top of a comment section (YouTube video, Reddit thread). Collapsed it is one slim line
// ("5,704 of 11,380 comments are repeats, in 1,068 groups"); hovering, focusing or clicking it expands it
// smoothly to the most repeated comments. Click pins it open (touch, keyboard). Lives in a shadow root,
// is re-attached if the site re-renders its comment section, and stays hidden when nothing is repeated.
import type { CopyGroup } from '../checks/commentCopies/types';
import { chevronIcon, closeIcon } from './icons';
import { createShadowHost, h } from './shadow';
import { COPIES_SUMMARY_CSS } from './styles';

const TOP = 3;
const SAMPLE_CHARS = 120;

export interface SummaryPlacement {
  /** Insert the card into `parent` before `before` (null = at the end). */
  parent: Element;
  before: Node | null;
}

export interface SummaryView {
  groups: CopyGroup[];
  loaded: number;
  loading: boolean;
  /** Text of a comment id, for the samples. */
  sampleOf(id: string): string | undefined;
}

export interface CopiesSummary {
  update(v: SummaryView): void;
  clear(): void;
  destroy(): void;
}

const kindLabel = (g: CopyGroup): string =>
  g.kind === 'campaign' && g.label ? `${g.label} named` : g.kind === 'exact' ? 'Same comment' : 'Similar wording';

export function createCopiesSummary(where: string, placement: () => SummaryPlacement | null): CopiesSummary {
  const sh = createShadowHost(COPIES_SUMMARY_CSS, 'display:block;');
  sh.host.setAttribute('data-unslop-copies-summary', '');
  const line = h('span', { class: 'line' });
  const toggle = h('button', { class: 'toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'copies-body' },
    h('span', { class: 'dot', 'aria-hidden': 'true' }), line, h('span', { class: 'chev', html: chevronIcon(14) }));
  const close = h('button', { class: 'x', type: 'button', 'aria-label': 'Hide repeated comments summary', html: closeIcon(12) });
  const list = h('ul', { class: 'list' });
  const card = h('section', { class: 'u card', 'aria-label': 'Repeated comments' },
    h('div', { class: 'bar' }, toggle, close),
    h('div', { class: 'body', id: 'copies-body' },
      h('div', { class: 'inner' },
        list,
        h('p', { class: 'fine' }, 'Each repeated comment is marked below. Worth a second look. Checks can be wrong.'))),
  );
  sh.root.appendChild(card);

  let dismissed = false;
  let visible = false;
  toggle.addEventListener('click', () => {
    const open = !card.classList.contains('open');
    card.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  close.addEventListener('click', () => {
    dismissed = true;
    sh.host.remove();
  });

  const attach = () => {
    if (!visible || dismissed || sh.host.isConnected) return;
    const p = placement();
    if (p) p.parent.insertBefore(sh.host, p.before);
  };
  // Sites re-render their comment sections (sorting, navigation): put the card back.
  let pending = 0;
  const observer = new MutationObserver(() => {
    if (pending || !visible || dismissed || sh.host.isConnected) return;
    pending = window.setTimeout(() => {
      pending = 0;
      attach();
    }, 300);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  return {
    update(v) {
      visible = v.groups.length > 0;
      if (!visible) {
        sh.host.remove();
        return;
      }
      const repeats = v.groups.reduce((a, g) => a + g.ids.length, 0);
      line.textContent = '';
      line.append(h('b', {}, repeats.toLocaleString()), ` of ${v.loaded.toLocaleString()} comments ${where} are repeats, in `,
        h('b', {}, v.groups.length.toLocaleString()), v.groups.length === 1 ? ' group' : ' groups', v.loading ? ' · checking…' : '');
      list.textContent = '';
      for (const g of v.groups.slice(0, TOP)) {
        const raw = (v.sampleOf(g.ids[0]) ?? '').replace(/\s+/g, ' ').trim();
        const text = raw.length > SAMPLE_CHARS ? `${raw.slice(0, SAMPLE_CHARS)}…` : raw;
        const acc = g.authors === 1 ? '1 account' : `${g.authors.toLocaleString()} accounts`;
        list.append(h('li', {},
          h('span', { class: 'n' }, `×${g.ids.length.toLocaleString()}`),
          h('span', { class: 'txt', title: raw }, text ? `“${text}”` : '(no text)'),
          h('span', { class: 'meta' }, `${kindLabel(g)} · from ${acc}`)));
      }
      attach();
    },
    clear() {
      visible = false;
      dismissed = false;
      card.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      sh.host.remove();
    },
    destroy() {
      observer.disconnect();
      window.clearTimeout(pending);
      sh.host.remove();
    },
  };
}
