// Reddit threads for comment copies (current design and old.reddit.com). No API key: Reddit's own JSON,
// which Reddit only serves to logged-in users (logged out it answers 403).
// TODO(hack): flag placement not yet confirmed on live Reddit; it avoids depending on slot names (see headerOf).
import { config } from '../../config/detectors.config';
import type { CopiesSite } from '../copies/controller';
import { fetchRedditComments } from './fetch';

export function isReddit(hostname: string): boolean {
  return /(^|\.)reddit\.com$/i.test(hostname);
}

const COMMENT_SEL = 'shreddit-comment, .thing.comment[data-fullname]';

/** "t1_abc" for a comment element, from its attributes or its permalink. */
function idOf(node: Element): string | null {
  const direct = node.getAttribute('thingid') ?? node.getAttribute('data-fullname');
  if (direct) return direct.startsWith('t1_') ? direct : `t1_${direct}`;
  const link = node.getAttribute('permalink') ?? node.querySelector<HTMLAnchorElement>('a[href*="/comment/"]')?.getAttribute('href') ?? '';
  const m = link.match(/\/comments?\/[a-z0-9]+\/[^/]*\/([a-z0-9]+)|\/comment\/([a-z0-9]+)/i);
  const id = m?.[1] ?? m?.[2];
  return id ? `t1_${id.toLowerCase()}` : null;
}

/**
 * Where the pill goes: right after this comment's author link. Reddit's comment element only shows children
 * placed in its named slots, so instead of guessing slot names we anchor to the author's profile link, which
 * is always visible. The link must belong to this comment, not to a nested reply.
 */
function headerOf(node: Element): Element | null {
  if (node.matches('.thing.comment')) return node.querySelector(':scope > .entry .tagline'); // old Reddit
  for (const a of node.querySelectorAll<HTMLAnchorElement>('a[href*="/user/"]')) {
    if (a.closest('shreddit-comment') !== node) continue; // a nested reply's author
    if (!a.textContent?.trim()) continue; // avatar link, no name
    const box = (a.closest('faceplate-hovercard') ?? a).parentElement;
    if (box && box !== node) return box; // a direct child of the comment element would not be shown
  }
  return node.querySelector(':scope > [slot="commentMeta"]') ?? node.querySelector(':scope > [slot="comment"]');
}

export const redditSite: CopiesSite = {
  name: 'Reddit',
  tryApi: false,
  ownSource: 'json',
  pageId(href) {
    try {
      return new URL(href).pathname.match(/\/comments\/([a-z0-9]+)/i)?.[1]?.toLowerCase() ?? null;
    } catch {
      return null;
    }
  },
  fetchAll(postId, o) {
    const cfg = config.commentCopies;
    return fetchRedditComments(postId, {
      maxComments: cfg.maxComments + cfg.maxReplies,
      workers: cfg.redditWorkers,
      isLive: o.isLive,
      onComments: o.onComments,
      stats: o.stats,
    });
  },
  // Above the comment tree (current design) or old Reddit's comment list.
  summaryPlacement() {
    const tree = document.querySelector('shreddit-comment-tree') ?? document.querySelector('.commentarea > .sitetable');
    if (tree?.parentElement) return { parent: tree.parentElement, before: tree };
    const first = document.querySelector('shreddit-comment');
    return first?.parentElement ? { parent: first.parentElement, before: first } : null;
  },
  flags: {
    where: 'in this thread',
    nodes: () => document.querySelectorAll(COMMENT_SEL),
    idOf,
    headerOf,
  },
};
