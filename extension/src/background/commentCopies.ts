// Service-worker side of the YouTube comment-copies check:
//  1. groups the comments a tab sends (here, so the YouTube page never freezes on big videos);
//  2. if the user saved a YouTube Data API key (options page), fetches comments through the official API,
//     100 per page instead of 20. Without a key, or if the API fails, the content script falls back to
//     YouTube's own page requests.
// Separate from combine/stats like group detection: nothing is recorded, everything is per tab and in memory.
import { groupComments } from '../checks/commentCopies/group';
import { COMMENT_COPIES_PORT, YT_STORAGE, type CopiesRequest, type CopiesResponse } from '../checks/commentCopies/messages';
import type { VideoComment } from '../checks/commentCopies/types';
import { config } from '../config/detectors.config';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function apiSettings(): Promise<{ key: string; useApi: boolean }> {
  const s = await chrome.storage.local.get([YT_STORAGE.apiKey, YT_STORAGE.useApi]);
  return { key: String(s[YT_STORAGE.apiKey] ?? '').trim(), useApi: s[YT_STORAGE.useApi] !== false };
}

async function api(path: string, params: Record<string, string | number | null>, key: string): Promise<Json> {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
  u.searchParams.set('key', key);
  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(u);
      if (res.ok) return (await res.json()) as Json;
    } catch {
      /* network error */
    }
    const body: Json = res ? await res.json().catch(() => ({})) : {};
    const reason: string = body.error?.errors?.[0]?.reason ?? (res ? `HTTP ${res.status}` : 'network error');
    const retryable = !res || res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 3) throw new Error(reason);
    await sleep(500 * 2 ** attempt);
  }
}

const fromApi = (c: Json, reply: boolean): VideoComment => ({
  id: c.id,
  author: c.snippet?.authorDisplayName ?? '',
  text: c.snippet?.textOriginal ?? c.snippet?.textDisplay ?? '',
  reply,
});

interface TabCtx {
  port: chrome.runtime.Port;
  run: number | null;
  apiRun: number | null;
  comments: VideoComment[];
}

function post(ctx: TabCtx, msg: CopiesResponse): void {
  try {
    ctx.port.postMessage(msg);
  } catch {
    /* tab gone */
  }
}

async function apiScan(ctx: TabCtx, run: number, videoId: string): Promise<void> {
  const cfg = config.commentCopies;
  const stale = () => ctx.apiRun !== run;
  const send = (m: Omit<Extract<CopiesResponse, { type: 'copies/api' }>, 'type' | 'run'>) => {
    if (!stale()) post(ctx, { type: 'copies/api', run, ...m });
  };
  const { key, useApi } = await apiSettings();
  if (!useApi) return send({ status: 'disabled' });
  if (!key) return send({ status: 'nokey' });

  const queue: string[] = [];
  let qi = 0;
  let topDone = false;
  let calls = 0;
  let top = 0;
  const topLevel = async () => {
    try {
      let pageToken: string | null = null;
      do {
        const d = await api('commentThreads', {
          part: 'snippet,replies', videoId, maxResults: 100, order: 'time', textFormat: 'plainText', pageToken,
        }, key);
        calls++;
        if (stale()) return;
        const out: VideoComment[] = [];
        for (const it of d.items ?? []) {
          const tc = it.snippet.topLevelComment;
          out.push(fromApi(tc, false));
          const n: number = it.snippet.totalReplyCount ?? 0;
          const got: Json[] = it.replies?.comments ?? [];
          if (n > 0 && got.length >= n) got.forEach((r) => out.push(fromApi(r, true))); // all replies came inline
          else if (n > 0) queue.push(tc.id);
        }
        top += d.items?.length ?? 0;
        send({ status: 'data', comments: out, calls });
        pageToken = d.nextPageToken ?? null;
      } while (pageToken && !stale() && top < cfg.maxComments);
    } finally {
      topDone = true;
    }
  };
  const worker = async () => {
    while (!stale()) {
      if (qi >= queue.length) {
        if (topDone) return;
        await sleep(50);
        continue;
      }
      const parentId = queue[qi++];
      let pageToken: string | null = null;
      do {
        const d = await api('comments', { part: 'snippet', parentId, maxResults: 100, textFormat: 'plainText', pageToken }, key);
        calls++;
        if (stale()) return;
        send({ status: 'data', comments: (d.items ?? []).map((r: Json) => fromApi(r, true)), calls });
        pageToken = d.nextPageToken ?? null;
      } while (pageToken && !stale());
    }
  };
  const results = await Promise.allSettled([topLevel(), ...Array.from({ length: cfg.apiWorkers }, worker)]);
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) send({ status: 'error', reason: String(failed.reason?.message ?? failed.reason), calls });
  else send({ status: 'done', calls });
}

export function registerCommentCopies(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== COMMENT_COPIES_PORT) return;
    const ctx: TabCtx = { port, run: null, apiRun: null, comments: [] };
    port.onDisconnect.addListener(() => {
      ctx.apiRun = null;
      ctx.comments = [];
    });
    port.onMessage.addListener((msg: CopiesRequest) => {
      switch (msg?.type) {
        case 'copies/reset': // new video
          ctx.run = msg.run;
          ctx.comments = [];
          if (ctx.apiRun !== msg.run) ctx.apiRun = null;
          break;
        case 'copies/add':
          if (msg.run === ctx.run) ctx.comments.push(...msg.comments);
          break;
        case 'copies/apiScan':
          ctx.apiRun = msg.run;
          void apiScan(ctx, msg.run, msg.videoId);
          break;
        case 'copies/group': {
          if (msg.run !== ctx.run) break;
          const cfg = config.commentCopies;
          const t = performance.now();
          const groups = groupComments(ctx.comments, {
            minChars: cfg.minChars,
            nearThreshold: cfg.nearThreshold,
            nearMinWords: cfg.nearMinWords,
            campaignMin: cfg.campaignMin,
            // Quick capped passes while the scan runs, one full pass at the end.
            maxDf: msg.final ? undefined : cfg.liveMaxDf,
          });
          post(ctx, { type: 'copies/groups', run: msg.run, final: msg.final, groups, ms: performance.now() - t });
          break;
        }
      }
    });
  });
}
