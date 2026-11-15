// Flags on comments that are repeated elsewhere on the same page (YouTube video, Reddit thread): a small
// pill after the author line ("Repeated 15 times"), with a dark hover box that says what was seen. Each
// pill lives in its own shadow root, so the site's CSS can't reach it. Where it goes is up to a FlagSite.
import type { CopyGroup } from '../checks/commentCopies/types';
import { createShadowHost, ensurePageStyle, h } from './shadow';
import { COMMENT_FLAG_CSS, COPY_TIP_CSS } from './styles';

const HOST_ATTR = 'data-unslop-copies';
const TIP_GAP = 8;
const HIDE_DELAY_MS = 150;

/** How one site exposes its comments in the page. */
export interface FlagSite {
  /** "on this video", "in this thread" */
  where: string;
  /** Every comment element currently in the page (top-level and replies). */
  nodes(): Iterable<Element>;
  /** The comment id, same form as VideoComment.id. */
  idOf(node: Element): string | null;
  /** Element the pill is appended to (this comment's own header, not a nested reply's). */
  headerOf(node: Element): Element | null;
  /** This comment's own text (dimmed or hidden with the "Flagged results" setting). */
  bodyOf(node: Element): Element | null;
}

/** Same setting as search results: dim the flagged comment's text, or hide it behind a Show link. */
export type FlagMode = 'dim' | 'hide';

export interface FlagCopy {
  title: string;
  pill: { lead: string; count: string; tail: string };
  detail: string;
}

/** Wording: describes what was seen, never intent ("flagged", not "fake" or "bot"). */
export function describe(g: CopyGroup, where = 'on this video'): FlagCopy {
  const n = g.ids.length;
  const acc = g.authors === 1 ? '1 account' : `${g.authors} accounts`;
  if (g.kind === 'campaign' && g.label) {
    return {
      title: 'Shared name',
      pill: { lead: `${g.label} in `, count: String(n), tail: ' comments' },
      detail: `${g.label} is named in ${n} comments ${where}, from ${acc}.`,
    };
  }
  return {
    title: 'Repeated comment',
    pill: { lead: 'Repeated ', count: String(n), tail: ' times' },
    detail:
      g.kind === 'exact'
        ? `The same comment appears ${n} times ${where}, from ${acc}.`
        : `Nearly the same wording appears ${n} times ${where}, from ${acc}.`,
  };
}

function createTip() {
  const sh = createShadowHost(
    COPY_TIP_CSS,
    'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;',
  );
  const title = h('p', { class: 't' });
  const detail = h('p', { class: 'r' });
  const tip = h('div', { class: 'u tip', role: 'tooltip', hidden: '' }, title, detail,
    h('p', { class: 'fine' }, 'Flagged. Checks can be wrong.'));
  sh.root.appendChild(tip);
  document.documentElement.appendChild(sh.host);
  let timer = 0;
  return {
    show(anchor: Element, copy: FlagCopy) {
      window.clearTimeout(timer);
      title.textContent = copy.title;
      detail.textContent = copy.detail;
      tip.hidden = false;
      const r = anchor.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const w = tip.offsetWidth;
      const th = tip.offsetHeight;
      const left = Math.max(8, Math.min(r.left, vw - w - 8));
      const below = r.bottom + TIP_GAP + th <= window.innerHeight - 8;
      const top = below ? r.bottom + TIP_GAP : r.top - TIP_GAP - th;
      tip.style.left = `${left + window.scrollX}px`;
      tip.style.top = `${top + window.scrollY}px`;
    },
    hideSoon() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (tip.hidden = true), HIDE_DELAY_MS);
    },
    remove: () => sh.remove(),
  };
}

/** Last pass over the page, for the console summary. */
export interface FlagStats {
  onPage: number; // comment elements found
  withId: number; // ...whose id could be read
  inGroups: number; // ...that belong to a repeat group
  noHeader: number; // ...in a group but with nowhere to put the pill
  flagged: number;
}

export interface CommentFlags {
  /** Flag every comment on screen whose id is in byId. Call again as groups change. */
  update(byId: Map<string, CopyGroup>): void;
  setMode(mode: FlagMode): void;
  stats(): FlagStats;
  clear(): void;
  destroy(): void;
}

export function createCommentFlags(site: FlagSite, initialMode: FlagMode): CommentFlags {
  const tip = createTip();
  ensurePageStyle(); // [data-unslop-dim] / [data-unslop-hidden] rules, shared with search results
  let byId = new Map<string, CopyGroup>();
  let mode: FlagMode = initialMode;
  const revealed = new Set<string>(); // hidden comments the user chose to show
  const copyFor = new WeakMap<HTMLElement, FlagCopy>();

  const fill = (host: HTMLElement, copy: FlagCopy, hidden: boolean) => {
    copyFor.set(host, copy);
    const pill = host.shadowRoot!.querySelector('.flag')!;
    pill.textContent = '';
    pill.append(h('span', { class: 'dot', 'aria-hidden': 'true' }), copy.pill.lead, h('b', {}, copy.pill.count), copy.pill.tail);
    pill.setAttribute('aria-label', `${copy.title}. ${copy.detail}`);
    const show = host.shadowRoot?.querySelector<HTMLElement>('.show');
    if (show) show.hidden = !hidden;
    host.dataset.key = `${copy.detail}|${hidden}`;
  };

  const makeHost = (copy: FlagCopy, id: string, hidden: boolean): HTMLElement => {
    const sh = createShadowHost(COMMENT_FLAG_CSS, 'display:inline-block;vertical-align:middle;margin-left:8px;');
    sh.host.setAttribute(HOST_ATTR, '');
    const pill = h('span', { class: 'u flag', tabindex: '0' });
    const show = h('button', { class: 'u show', type: 'button', hidden: '' }, 'Show comment');
    show.addEventListener('click', (e) => {
      e.stopPropagation();
      revealed.add(id);
      applyAll();
    });
    sh.root.append(pill, show);
    const showTip = () => tip.show(pill, copyFor.get(sh.host)!);
    pill.addEventListener('mouseenter', showTip);
    pill.addEventListener('focus', showTip);
    pill.addEventListener('mouseleave', () => tip.hideSoon());
    pill.addEventListener('blur', () => tip.hideSoon());
    fill(sh.host, copy, hidden);
    return sh.host;
  };

  let last: FlagStats = { onPage: 0, withId: 0, inGroups: 0, noHeader: 0, flagged: 0 };
  const applyAll = () => {
    const st: FlagStats = { onPage: 0, withId: 0, inGroups: 0, noHeader: 0, flagged: 0 };
    for (const node of site.nodes()) {
      st.onPage++;
      const id = site.idOf(node);
      if (id) st.withId++;
      const g = id ? byId.get(id) : undefined;
      const want = !!g;
      if (want) st.inGroups++;
      const body = site.bodyOf(node);
      const hidden = want && mode === 'hide' && !revealed.has(id!);
      if (body) {
        body.toggleAttribute('data-unslop-dim', want && mode === 'dim');
        body.toggleAttribute('data-unslop-hidden', hidden);
      }
      const header = site.headerOf(node);
      if (!header) {
        if (want) st.noHeader++;
        continue;
      }
      const existing = header.querySelector<HTMLElement>(`:scope > [${HOST_ATTR}]`);
      if (!want) {
        existing?.remove();
        continue;
      }
      const copy = describe(g!, site.where);
      // A pill made by an older build (no Show link) is replaced rather than updated.
      if (existing && !existing.shadowRoot?.querySelector('.show')) existing.remove();
      if (existing?.isConnected) {
        if (existing.dataset.key !== `${copy.detail}|${hidden}`) fill(existing, copy, hidden);
      } else header.appendChild(makeHost(copy, id!, hidden));
      st.flagged++;
    }
    last = st;
  };

  let pending = 0;
  const observer = new MutationObserver(() => {
    if (pending || !byId.size) return;
    pending = window.setTimeout(() => {
      pending = 0;
      applyAll();
    }, 300);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  return {
    update(next) {
      byId = next;
      applyAll();
    },
    stats: () => last,
    setMode(next) {
      if (next === mode) return;
      mode = next;
      applyAll();
    },
    clear() {
      byId = new Map();
      revealed.clear();
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((e) => e.remove());
      for (const node of site.nodes()) {
        const body = site.bodyOf(node);
        body?.removeAttribute('data-unslop-dim');
        body?.removeAttribute('data-unslop-hidden');
      }
    },
    destroy() {
      observer.disconnect();
      window.clearTimeout(pending);
      this.clear();
      tip.remove();
    },
  };
}
