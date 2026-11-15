// YouTube comment copies: on a watch page, loads every comment and reply in the background, has the
// service worker group the copies, and flags each repeated comment on screen with how many times it appears.
// Order of sources: official API through the worker when the user saved a key (100 per page), else
// YouTube's own page requests (20 per page). Follows YouTube's in-app navigation between videos.
import { COMMENT_COPIES_PORT, type CopiesRequest, type CopiesResponse } from '../../checks/commentCopies/messages';
import type { CopyGroup, VideoComment } from '../../checks/commentCopies/types';
import { config } from '../../config/detectors.config';
import type { Settings } from '../../engine/messages';
import { createCommentFlags } from '../../ui/commentFlag';
import type { Controller } from '../search';
import { fetchAllComments } from './innertube';

export function isYouTube(hostname: string): boolean {
  return /(^|\.)youtube\.com$/i.test(hostname);
}

const videoIdOf = (href: string): string | null => {
  try {
    const u = new URL(href);
    return u.pathname === '/watch' ? u.searchParams.get('v') : null;
  } catch {
    return null;
  }
};

interface Scan {
  run: number;
  videoId: string;
  comments: VideoComment[];
  seen: Set<string>;
  sent: number;
  done: boolean;
  source: 'api' | 'page' | null;
  apiResolve: ((status: string) => void) | null;
  finalApplied: boolean;
}

/** Debug view for testing in DevTools: window.__unslopCopies (content-script world). */
export interface CopiesDebug {
  videoId: string;
  comments: number;
  replies: number;
  groups: number;
  flagged: number;
  source: string | null;
  apiNote: string | null;
  done: boolean;
  secs: number;
  error: string | null;
}

export function startYouTubeCopies(_initial: Settings): Controller {
  const cfg = config.commentCopies;
  const flags = createCommentFlags(cfg.minFlagCount);
  let run = 0;
  let scan: Scan | null = null;
  let port: chrome.runtime.Port | null = null;
  let portRun = -1; // run the worker last saw a reset for
  let busy = false;
  let lastGroup = 0;
  let destroyed = false;
  const debug: CopiesDebug = { videoId: '', comments: 0, replies: 0, groups: 0, flagged: 0, source: null, apiNote: null, done: false, secs: 0, error: null };
  (window as unknown as { __unslopCopies?: CopiesDebug }).__unslopCopies = debug;
  let t0 = 0;

  const send = (msg: CopiesRequest): boolean => {
    try {
      if (!port) {
        port = chrome.runtime.connect({ name: COMMENT_COPIES_PORT });
        portRun = -1;
        port.onMessage.addListener(onMessage);
        port.onDisconnect.addListener(() => {
          port = null;
          busy = false;
          // Worker restarted: an API scan in flight is lost, continue with page requests.
          if (scan?.apiResolve) {
            const r = scan.apiResolve;
            scan.apiResolve = null;
            r('worker restarted');
          }
        });
      }
      port.postMessage(msg);
      return true;
    } catch {
      port = null;
      return false;
    }
  };

  const applyGroups = (groups: CopyGroup[]) => {
    const byId = new Map<string, CopyGroup>();
    for (const g of groups) for (const id of g.ids) byId.set(id, g);
    debug.groups = groups.length;
    debug.flagged = groups.reduce((a, g) => a + (g.ids.length >= cfg.minFlagCount ? g.ids.length : 0), 0);
    flags.update(byId);
  };

  function onMessage(msg: CopiesResponse) {
    const s = scan;
    if (!s || msg.run !== s.run) return;
    if (msg.type === 'copies/groups') {
      if (!msg.final) busy = false;
      if (s.finalApplied && !msg.final) return;
      if (msg.final) s.finalApplied = true;
      applyGroups(msg.groups);
    } else if (msg.type === 'copies/api' && s.apiResolve) {
      if (msg.status === 'data') {
        addComments(msg.comments ?? []);
        regroup(false);
      } else {
        const r = s.apiResolve;
        s.apiResolve = null;
        r(msg.status === 'error' ? msg.reason ?? 'error' : msg.status);
      }
    }
  }

  const addComments = (list: VideoComment[]) => {
    const s = scan!;
    for (const c of list) {
      if (!c.id || s.seen.has(c.id)) continue;
      s.seen.add(c.id);
      s.comments.push(c);
      if (c.reply) debug.replies++;
      else debug.comments++;
    }
  };

  /** Send new comments to the worker and ask for groups: quick passes while scanning, one full pass at the end. */
  function regroup(final: boolean) {
    const s = scan;
    if (!s) return;
    if (portRun !== s.run || !port) {
      if (!send({ type: 'copies/reset', run: s.run })) return;
      portRun = s.run;
      s.sent = 0;
    }
    if (s.sent < s.comments.length) {
      send({ type: 'copies/add', run: s.run, comments: s.comments.slice(s.sent) });
      s.sent = s.comments.length;
    }
    if (final) {
      send({ type: 'copies/group', run: s.run, final: true });
      return;
    }
    const now = Date.now();
    if (busy || now - lastGroup < cfg.liveRegroupMs) return;
    lastGroup = now;
    busy = true;
    send({ type: 'copies/group', run: s.run, final: false });
  }

  async function start(videoId: string) {
    const myRun = ++run;
    const live = () => myRun === run && !destroyed;
    flags.clear();
    scan = { run: myRun, videoId, comments: [], seen: new Set(), sent: 0, done: false, source: null, apiResolve: null, finalApplied: false };
    Object.assign(debug, { videoId, comments: 0, replies: 0, groups: 0, flagged: 0, source: null, apiNote: null, done: false, secs: 0, error: null });
    t0 = Date.now();
    const s = scan;

    // 1. Official API through the worker, when a key is saved.
    s.source = 'api';
    debug.source = 'api';
    const status = await new Promise<string>((resolve) => {
      s.apiResolve = resolve;
      if (!send({ type: 'copies/apiScan', run: myRun, videoId })) {
        s.apiResolve = null;
        resolve('worker unavailable');
      }
    });
    if (!live()) return;
    if (status !== 'done') {
      debug.apiNote = status; // 'nokey', 'disabled' or the API's error reason
      // 2. YouTube's own page requests. Comments already loaded through the API are skipped.
      s.source = 'page';
      debug.source = 'page';
      try {
        await fetchAllComments(videoId, {
          maxComments: cfg.maxComments,
          maxReplies: cfg.maxReplies,
          replyWorkers: cfg.replyWorkers,
          isLive: live,
          onComments: (list) => {
            addComments(list);
            regroup(false);
          },
        });
      } catch (e) {
        if (live()) debug.error = String((e as Error).message ?? e);
      }
    }
    if (!live()) return;
    s.done = true;
    debug.done = true;
    debug.secs = (Date.now() - t0) / 1000;
    regroup(true);
  }

  // Follow YouTube's in-app navigation (no full page load between videos).
  let current: string | null = null;
  const check = () => {
    if (destroyed) return;
    const id = videoIdOf(location.href);
    if (id === current) return;
    current = id;
    run++; // stops any scan in flight
    scan = null;
    flags.clear();
    if (id) void start(id);
  };
  document.addEventListener('yt-navigate-finish', check);
  const poll = window.setInterval(check, 1000);
  check();

  return {
    update() {
      /* nothing depends on the shared settings beyond on/off, handled by the caller */
    },
    destroy() {
      destroyed = true;
      run++;
      document.removeEventListener('yt-navigate-finish', check);
      window.clearInterval(poll);
      flags.destroy();
      try {
        port?.disconnect();
      } catch {
        /* already gone */
      }
      port = null;
    },
  };
}
