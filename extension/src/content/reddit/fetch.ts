// Loads every comment in a Reddit thread with Reddit's own JSON endpoints, from the page's origin (so the
// user's Reddit session applies; nothing goes anywhere else):
//   1. <origin>/comments/<postId>.json        the tree, up to ~500 comments, with "more" placeholders;
//   2. <origin>/api/morechildren.json         fills "load more comments" placeholders, 100 ids per call;
//   3. <origin>/comments/<postId>/_/<id>.json "continue this thread" placeholders (deep reply chains).
// Reddit rate-limits these, so few requests run at once and a 429 waits out Reddit's reset time.
// TODO(hack): written against Reddit's documented JSON shape; not yet run against live Reddit.
import type { FetchStats } from '../../checks/commentCopies/messages';
import type { VideoComment } from '../../checks/commentCopies/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const SKIP_BODIES = new Set(['[deleted]', '[removed]', '']);

/** Pull comments and pending placeholders out of a list of Reddit "things" (any depth). Exported for tests. */
export function collect(things: Json[], out: VideoComment[], more: string[], deep: string[]): void {
  for (const t of things ?? []) {
    const d = t?.data;
    if (!d) continue;
    if (t.kind === 't1') {
      const body = String(d.body ?? '');
      if (!SKIP_BODIES.has(body.trim()) && d.author !== '[deleted]') {
        out.push({
          id: d.name ?? `t1_${d.id}`, // "t1_abc": same as the page's thingid / data-fullname
          author: String(d.author ?? ''),
          text: body,
          reply: String(d.parent_id ?? '').startsWith('t1_'),
        });
      }
      if (d.replies && typeof d.replies === 'object') collect(d.replies.data?.children ?? [], out, more, deep);
    } else if (t.kind === 'more') {
      const kids: string[] = d.children ?? [];
      if (kids.length) more.push(...kids);
      else if (d.parent_id?.startsWith('t1_')) deep.push(d.parent_id.slice(3)); // "continue this thread"
    }
  }
}

export interface RedditFetchOptions {
  maxComments: number;
  workers: number;
  isLive(): boolean;
  onComments(comments: VideoComment[]): void;
  stats?: FetchStats;
}

export async function fetchRedditComments(postId: string, o: RedditFetchOptions): Promise<void> {
  const origin = location.origin;
  let coolUntil = 0;
  const get = async (path: string): Promise<Json> => {
    for (let attempt = 0; ; attempt++) {
      const wait = coolUntil - Date.now();
      if (wait > 0) await sleep(wait);
      let res: Response | null = null;
      if (o.stats) o.stats.requests++;
      try {
        res = await fetch(`${origin}${path}`, { credentials: 'include', headers: { accept: 'application/json' } });
        if (o.stats) o.stats.lastStatus = res.status;
        if (res.ok) return (await res.json()) as Json;
      } catch {
        /* network error */
      }
      const retryable = !res || res.status === 429 || res.status >= 500;
      const why = res ? `HTTP ${res.status}` : 'network error';
      if (o.stats) o.stats.lastError = why;
      if (!retryable || attempt >= 4) throw new Error(why);
      if (o.stats) o.stats.retries++;
      // Reddit says when the limit resets (seconds); otherwise back off 1 s, 2 s, 4 s, 8 s.
      const reset = Number(res?.headers.get('x-ratelimit-reset') ?? res?.headers.get('retry-after'));
      coolUntil = Math.max(coolUntil, Date.now() + (reset > 0 ? Math.min(reset, 60) * 1000 : 1000 * 2 ** attempt));
    }
  };

  let total = 0;
  const more: string[] = [];
  const deep: string[] = [];
  const emit = (things: Json[]) => {
    const out: VideoComment[] = [];
    collect(things, out, more, deep);
    total += out.length;
    if (out.length) o.onComments(out);
  };

  const tree = await get(`/comments/${postId}.json?limit=500&depth=10&raw_json=1`);
  if (!o.isLive()) return;
  emit(tree?.[1]?.data?.children ?? []);

  const worker = async () => {
    while (o.isLive() && total < o.maxComments) {
      if (more.length) {
        const ids = more.splice(0, 100);
        const d = await get(`/api/morechildren.json?api_type=json&raw_json=1&limit_children=false&link_id=t3_${postId}&children=${ids.join(',')}`);
        if (!o.isLive()) return;
        emit(d?.json?.data?.things ?? []); // flat list; may contain further "more" placeholders
      } else if (deep.length) {
        const id = deep.shift()!;
        const d = await get(`/comments/${postId}/_/${id}.json?limit=500&depth=10&raw_json=1`);
        if (!o.isLive()) return;
        emit(d?.[1]?.data?.children ?? []);
      } else return;
    }
  };
  // Workers may finish while another is still adding placeholders: loop until nothing is left.
  while (o.isLive() && (more.length || deep.length) && total < o.maxComments) {
    await Promise.all(Array.from({ length: o.workers }, worker));
  }
}
