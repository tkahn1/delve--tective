// Reddit threads for comment copies (current design and old.reddit.com). No API key: Reddit's own JSON.
// TODO(hack): flag placement written against Reddit's page structure, not yet checked on live Reddit.
import { config } from '../../config/detectors.config';
import type { CopiesSite } from '../copies/controller';
import { fetchRedditComments } from './fetch';

export function isReddit(hostname: string): boolean {
  return /(^|\.)reddit\.com$/i.test(hostname);
}

const isOld = () => location.hostname.startsWith('old.') || !!document.querySelector('.commentarea .thing.comment');

export const redditSite: CopiesSite = {
  name: 'Reddit',
  tryApi: false,
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
    });
  },
  flags: {
    where: 'in this thread',
    // Current design: <shreddit-comment thingid="t1_abc">. Old design: <div class="thing comment" data-fullname="t1_abc">.
    nodes: () => document.querySelectorAll('shreddit-comment[thingid], .thing.comment[data-fullname]'),
    idOf: (node) => node.getAttribute('thingid') ?? node.getAttribute('data-fullname'),
    headerOf: (node) =>
      isOld()
        ? node.querySelector(':scope > .entry .tagline')
        : // Replies are nested <shreddit-comment>s, so only this comment's own direct children.
          node.querySelector(':scope > [slot="commentMeta"]') ?? node.querySelector(':scope > [slot="comment"]'),
  },
};
