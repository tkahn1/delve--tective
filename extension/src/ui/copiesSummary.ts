// Summary card at the top of a comment section (YouTube video, Reddit thread): how many comments are
// repeats, and the most repeated ones with a short sample. Lives in a shadow root; re-attached if the site
// re-renders its comment section. Hidden when nothing is repeated.
import type { CopyGroup } from '../checks/commentCopies/types';
import { closeIcon } from './icons';
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
  /** Text and author of a comment id, for the samples. */
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
  const close = h('button', { class: 'x', type: 'button', 'aria-label': 'Hide summary', html: closeIcon(14) });
  const sum = h('p', { class: 'sum' });
  const list = h('ul', { class: 'list' });
  const card = h('section', { class: 'u card', 'aria-label': 'Repeated comments' },
    h('div', { class: 'head' }, h('h2', {}, 'Repeated comments'), close),
    sum,
    list,
    h('p', { class: 'fine' }, 'Each repeated comment is marked below. Worth a second look. Checks can be wrong.'),
  );
  sh.root.appendChild(card);

  let dismissed = false;
  let visible = false;
  close.addEventListener('click', () => {
    dismissed = true;
    sh.host.remove();
  });

  const attach = () => {
    if (!visible || dismissed) return;
    if (sh.host.isConnected) return;
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
      const repeats = v.groups.reduce((a, g) => a + g.ids.length, 0);
      visible = v.groups.length > 0;
      if (!visible) {
        sh.host.remove();
        return;
      }
      sum.textContent = '';
      sum.append(h('b', {}, repeats.toLocaleString()), ` of ${v.loaded.toLocaleString()} comments ${where} are repeats, in `,
        h('b', {}, v.groups.length.toLocaleString()), v.groups.length === 1 ? ' group' : ' groups', v.loading ? ' (still checking)' : '', '.');
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
      sh.host.remove();
    },
    destroy() {
      observer.disconnect();
      window.clearTimeout(pending);
      sh.host.remove();
    },
  };
}
