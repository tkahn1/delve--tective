// Fetches every comment and reply on a YouTube video with the same "load more" requests YouTube's own page
// makes when you scroll (same origin, so the user's YouTube session applies; nothing goes anywhere else).
// Top-level pages are a chain (each page holds the link to the next) read in "Newest first" order, because
// "Top comments" stops after a few hundred on big videos. Reply threads are fetched in parallel alongside.
// Undocumented interface: a YouTube change can break it. TODO(hack): no automated test against live YouTube.
import type { VideoComment } from '../../checks/commentCopies/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Client info parsed from the page's own config script (the content script can't read page variables). */
function clientContext(): Record<string, unknown> {
  const html = Array.from(document.scripts, (s) => s.textContent ?? '').join('\n');
  const pick = (key: string) => html.match(new RegExp(`"${key}":"([^"]+)"`))?.[1];
  return {
    client: {
      clientName: 'WEB',
      clientVersion: pick('INNERTUBE_CLIENT_VERSION') ?? '2.20261112.10.00',
      hl: pick('HL') ?? 'en',
      gl: pick('GL') ?? 'US',
    },
  };
}

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function walk(obj: unknown, fn: (o: Json) => void): void {
  if (!obj || typeof obj !== 'object') return;
  fn(obj as Json);
  for (const k in obj as Json) walk((obj as Json)[k], fn);
}

const runsText = (t: Json | undefined): string => t?.simpleText ?? (t?.runs ?? []).map((r: Json) => r.text).join('');
const contToken = (c: Json | undefined): string | null =>
  c?.continuationEndpoint?.continuationCommand?.token ?? c?.button?.buttonRenderer?.command?.continuationCommand?.token ?? null;

interface Page {
  comments: VideoComment[];
  next: string | null;
  newest: string | null;
  total: number | null;
  replyTokens: string[];
}

function parsePage(res: Json): Page {
  const out: VideoComment[] = [];
  const replyTokens: string[] = [];
  let next: string | null = null;
  let newest: string | null = null;
  let total: number | null = null;
  const items: Json[] = [];
  for (const e of res.onResponseReceivedEndpoints ?? []) {
    const list = (e.reloadContinuationItemsCommand ?? e.appendContinuationItemsAction)?.continuationItems;
    if (list) items.push(...list);
  }
  for (const it of items) {
    const h = it.commentsHeaderRenderer;
    if (h) {
      total = parseInt(runsText(h.countText ?? h.commentsCount).replace(/[^\d]/g, ''), 10) || total;
      const sub: Json[] = h.sortMenu?.sortFilterSubMenuRenderer?.subMenuItems ?? [];
      const item = sub.find((x) => /new/i.test(x.title ?? '')) ?? sub[1];
      newest = item?.serviceEndpoint?.continuationCommand?.token ?? newest;
    }
    if (it.continuationItemRenderer) next = contToken(it.continuationItemRenderer) ?? next;
    const thread = it.commentThreadRenderer;
    if (thread) {
      walk(thread.replies, (o) => {
        const t = contToken(o.continuationItemRenderer);
        if (t) replyTokens.push(t);
      });
      const old = thread.comment?.commentRenderer; // older layout
      if (old) out.push({ id: old.commentId, author: runsText(old.authorText), text: runsText(old.contentText), reply: false });
    }
    const oldReply = it.commentRenderer;
    if (oldReply) out.push({ id: oldReply.commentId, author: runsText(oldReply.authorText), text: runsText(oldReply.contentText), reply: true });
  }
  // Current layout: comment text lives in entity mutations.
  for (const m of res.frameworkUpdates?.entityBatchUpdate?.mutations ?? []) {
    const p = m.payload?.commentEntityPayload;
    if (!p?.properties) continue;
    out.push({
      id: p.properties.commentId,
      author: p.author?.displayName ?? '',
      text: p.properties.content?.content ?? '',
      reply: (p.properties.replyLevel ?? 0) > 0,
    });
  }
  return { comments: out, next, newest, total, replyTokens };
}

function firstToken(watch: Json): string | null {
  let token: string | null = null;
  walk(watch, (o) => {
    const s = o.itemSectionRenderer;
    if (token || s?.sectionIdentifier !== 'comment-item-section') return;
    for (const it of s.contents ?? []) token = contToken(it.continuationItemRenderer) ?? token;
  });
  return token;
}

export interface InnertubeOptions {
  maxComments: number;
  maxReplies: number;
  replyWorkers: number;
  isLive(): boolean;
  onComments(comments: VideoComment[]): void;
  onProgress?(p: { total: number | null; threadsDone: number; threadsTotal: number }): void;
}

/** Resolves when done; throws on a non-retryable error. */
export async function fetchAllComments(videoId: string, o: InnertubeOptions): Promise<void> {
  const context = clientContext();
  // No fixed pause between requests. If YouTube pushes back (429 / 5xx / network error), every request
  // waits out a shared cool-down that doubles each retry: 0.5 s, 1 s, 2 s, 4 s.
  let coolUntil = 0;
  const yt = async (body: Json): Promise<Json> => {
    for (let attempt = 0; ; attempt++) {
      const wait = coolUntil - Date.now();
      if (wait > 0) await sleep(wait);
      let res: Response | null = null;
      try {
        res = await fetch('/youtubei/v1/next?prettyPrint=false', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ context, ...body }),
        });
        if (res.ok) return (await res.json()) as Json;
      } catch {
        /* network error: retry below */
      }
      const retryable = !res || res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= 4) throw new Error(res ? `HTTP ${res.status}` : 'network error');
      coolUntil = Math.max(coolUntil, Date.now() + 500 * 2 ** attempt);
    }
  };

  const replyQueue: string[] = [];
  let qi = 0;
  let topDone = false;
  let topCount = 0;
  let replyCount = 0;
  let threadsDone = 0;
  let total: number | null = null;
  const progress = () => o.onProgress?.({ total, threadsDone, threadsTotal: replyQueue.length });
  const take = (list: VideoComment[]) => {
    for (const c of list) (c.reply ? replyCount++ : topCount++);
    o.onComments(list);
  };

  const topLevel = async () => {
    try {
      const watch = await yt({ videoId });
      let token = firstToken(watch);
      if (!token) throw new Error('comments are off or not found');
      let sortedNewest = false;
      while (token && o.isLive() && topCount < o.maxComments) {
        const page = parsePage(await yt({ continuation: token }));
        if (!o.isLive()) return;
        if (page.total) total = page.total;
        take(page.comments);
        replyQueue.push(...page.replyTokens);
        token = page.newest && !sortedNewest ? page.newest : page.next;
        if (page.newest) sortedNewest = true;
        progress();
      }
    } finally {
      topDone = true;
    }
  };

  const replyWorker = async () => {
    while (o.isLive() && replyCount < o.maxReplies) {
      if (qi >= replyQueue.length) {
        if (topDone) return;
        await sleep(100);
        continue;
      }
      let t: string | null = replyQueue[qi++];
      while (t && o.isLive()) {
        const page = parsePage(await yt({ continuation: t }));
        if (!o.isLive()) return;
        take(page.comments);
        replyQueue.push(...page.replyTokens); // replies to replies are threads of their own
        t = page.next;
      }
      threadsDone++;
      progress();
    }
  };

  const results = await Promise.allSettled([topLevel(), ...Array.from({ length: o.replyWorkers }, replyWorker)]);
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) throw failed.reason instanceof Error ? failed.reason : new Error(String(failed.reason));
}
