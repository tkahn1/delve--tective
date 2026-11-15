// Flags on YouTube comments that are repeated elsewhere on the video: a small pill after the author
// line ("Repeated 15 times"), with a dark hover box that says what was seen. Each pill lives in its own
// shadow root, so YouTube's CSS can't reach it. Works for top-level comments and replies.
import type { CopyGroup } from '../checks/commentCopies/types';
import { createShadowHost, h } from './shadow';
import { COMMENT_FLAG_CSS, COPY_TIP_CSS } from './styles';

const COMMENT_SEL = 'ytd-comments ytd-comment-view-model, ytd-comments ytd-comment-renderer';
const HOST_ATTR = 'data-unslop-copies';
const TIP_GAP = 8;
const HIDE_DELAY_MS = 150;

export interface FlagCopy {
  title: string;
  pill: { lead: string; count: string; tail: string };
  detail: string;
}

/** Wording: describes what was seen, never intent ("worth a second look", not "fake" or "bot"). */
export function describe(g: CopyGroup): FlagCopy {
  const n = g.ids.length;
  const acc = g.authors === 1 ? '1 account' : `${g.authors} accounts`;
  if (g.kind === 'campaign' && g.label) {
    return {
      title: 'Shared name',
      pill: { lead: `${g.label} in `, count: String(n), tail: ' comments' },
      detail: `${g.label} is named in ${n} comments on this video, from ${acc}.`,
    };
  }
  return {
    title: 'Repeated comment',
    pill: { lead: 'Repeated ', count: String(n), tail: ' times' },
    detail:
      g.kind === 'exact'
        ? `The same comment appears ${n} times on this video, from ${acc}.`
        : `Nearly the same wording appears ${n} times on this video, from ${acc}.`,
  };
}

/** Comment id from the timestamp link (`&lc=<id>`); replies are "<parentId>.<replyId>". */
function commentIdOf(node: Element): string | null {
  const a = node.querySelector<HTMLAnchorElement>('#published-time-text a');
  if (!a) return null;
  try {
    return new URL(a.href, location.origin).searchParams.get('lc');
  } catch {
    return null;
  }
}

function createTip() {
  const sh = createShadowHost(
    COPY_TIP_CSS,
    'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;',
  );
  const title = h('p', { class: 't' });
  const detail = h('p', { class: 'r' });
  const tip = h('div', { class: 'u tip', role: 'tooltip', hidden: '' }, title, detail,
    h('p', { class: 'fine' }, 'Worth a second look. Checks can be wrong.'));
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

export interface CommentFlags {
  /** Flag every comment on screen whose id is in a group of at least minCount. Call again as groups change. */
  update(byId: Map<string, CopyGroup>): void;
  clear(): void;
  destroy(): void;
}

export function createCommentFlags(minCount: number): CommentFlags {
  const tip = createTip();
  let byId = new Map<string, CopyGroup>();
  const copyFor = new WeakMap<HTMLElement, FlagCopy>();

  const makeHost = (copy: FlagCopy): HTMLElement => {
    const sh = createShadowHost(COMMENT_FLAG_CSS, 'display:inline-block;vertical-align:middle;margin-left:8px;');
    sh.host.setAttribute(HOST_ATTR, '');
    const pill = h('span', { class: 'u flag', tabindex: '0' });
    sh.root.appendChild(pill);
    const show = () => tip.show(pill, copyFor.get(sh.host)!);
    pill.addEventListener('mouseenter', show);
    pill.addEventListener('focus', show);
    pill.addEventListener('mouseleave', () => tip.hideSoon());
    pill.addEventListener('blur', () => tip.hideSoon());
    fill(sh.host, copy);
    return sh.host;
  };

  const fill = (host: HTMLElement, copy: FlagCopy) => {
    copyFor.set(host, copy);
    const pill = host.shadowRoot!.querySelector('.flag')!;
    pill.textContent = '';
    pill.append(h('span', { class: 'dot', 'aria-hidden': 'true' }), copy.pill.lead, h('b', {}, copy.pill.count), copy.pill.tail);
    pill.setAttribute('aria-label', `${copy.title}. ${copy.detail}`);
    host.dataset.key = copy.detail;
  };

  const applyAll = () => {
    for (const node of document.querySelectorAll(COMMENT_SEL)) {
      const header = node.querySelector('#header-author');
      if (!header) continue;
      // Only this comment's own header: replies are nested inside top-level comment elements.
      const existing = header.querySelector<HTMLElement>(`:scope > [${HOST_ATTR}]`);
      const id = commentIdOf(node);
      const g = id ? byId.get(id) : undefined;
      if (!g || g.ids.length < minCount) {
        existing?.remove();
        continue;
      }
      const copy = describe(g);
      if (existing) {
        if (existing.dataset.key !== copy.detail) fill(existing, copy);
      } else header.appendChild(makeHost(copy));
    }
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
    clear() {
      byId = new Map();
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((e) => e.remove());
    },
    destroy() {
      observer.disconnect();
      window.clearTimeout(pending);
      this.clear();
      tip.remove();
    },
  };
}
