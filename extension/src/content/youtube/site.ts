// YouTube watch pages for comment copies: API first (worker, saved key), else YouTube's own page requests.
import { config } from '../../config/detectors.config';
import type { CopiesSite } from '../copies/controller';
import { fetchAllComments } from './innertube';

export function isYouTube(hostname: string): boolean {
  return /(^|\.)youtube\.com$/i.test(hostname);
}

/** Comment id from the timestamp link (`&lc=<id>`); replies are "<parentId>.<replyId>". */
function idOf(node: Element): string | null {
  const a = node.querySelector<HTMLAnchorElement>('#published-time-text a');
  if (!a) return null;
  try {
    return new URL(a.href, location.origin).searchParams.get('lc');
  } catch {
    return null;
  }
}

export const youtubeSite: CopiesSite = {
  name: 'YouTube',
  tryApi: true,
  ownSource: 'page',
  navEvent: 'yt-navigate-finish',
  pageId(href) {
    try {
      const u = new URL(href);
      return u.pathname === '/watch' ? u.searchParams.get('v') : null;
    } catch {
      return null;
    }
  },
  fetchAll(videoId, o) {
    const cfg = config.commentCopies;
    return fetchAllComments(videoId, {
      maxComments: cfg.maxComments,
      maxReplies: cfg.maxReplies,
      replyWorkers: cfg.replyWorkers,
      isLive: o.isLive,
      onComments: o.onComments,
      stats: o.stats,
    });
  },
  // Under the "N Comments / Sort by" header, above the first comment.
  summaryPlacement() {
    const header = document.querySelector('ytd-comments ytd-comments-header-renderer')?.closest('#header')
      ?? document.querySelector('ytd-comments #header');
    return header?.parentElement ? { parent: header.parentElement, before: header.nextSibling } : null;
  },
  flags: {
    where: 'on this video',
    nodes: () => document.querySelectorAll('ytd-comments ytd-comment-view-model, ytd-comments ytd-comment-renderer'),
    idOf,
    // Each comment and reply has its own header; replies are siblings, not descendants, of their parent's header.
    headerOf: (node) => node.querySelector('#header-author'),
    bodyOf: (node) => node.querySelector('#content-text')?.closest('#expander') ?? node.querySelector('#content-text'),
  },
};
