// Comment copies on any supported site (YouTube videos, Reddit threads): loads every comment in the
// background, has the service worker group the copies, and flags each repeated comment on screen with how
// many times it appears. A CopiesSite says how to recognise a page, fetch its comments and place flags.
import { COMMENT_COPIES_PORT, type CopiesRequest, type CopiesResponse } from '../../checks/commentCopies/messages';
import type { CopyGroup, VideoComment } from '../../checks/commentCopies/types';
import { config } from '../../config/detectors.config';
import { createCommentFlags, type FlagSite } from '../../ui/commentFlag';
import type { Controller } from '../search';

export interface FetchOptions {
  isLive(): boolean;
  onComments(comments: VideoComment[]): void;
}

export interface CopiesSite {
  name: string;
  /** Page id (video id, post id) for this URL, or null when the page has no comments to check. */
  pageId(href: string): string | null;
  /** Ask the service worker to try the official API first (YouTube with a saved key). */
  tryApi: boolean;
  /** DOM event the site fires on in-app navigation, if any (the URL is also polled). */
  navEvent?: string;
  fetchAll(id: string, o: FetchOptions): Promise<void>;
  flags: FlagSite;
}

interface Scan {
  run: number;
  comments: VideoComment[];
  seen: Set<string>;
  sent: number;
  apiResolve: ((status: string) => void) | null;
  finalApplied: boolean;
}

export function startCommentCopies(site: CopiesSite): Controller {
  const cfg = config.commentCopies;
  const flags = createCommentFlags(site.flags, cfg.minFlagCount);
  let run = 0;
  let scan: Scan | null = null;
  let port: chrome.runtime.Port | null = null;
  let portRun = -1; // run the worker last saw a reset for
  let busy = false;
  let lastGroup = 0;
  let destroyed = false;

  const send = (msg: CopiesRequest): boolean => {
    try {
      if (!port) {
        port = chrome.runtime.connect({ name: COMMENT_COPIES_PORT });
        portRun = -1;
        port.onMessage.addListener(onMessage);
        port.onDisconnect.addListener(() => {
          port = null;
          busy = false;
          // Worker restarted: an API scan in flight is lost, continue with the site's own requests.
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
      if (msg.final) {
        // One line per page in the console, to see where it stops if no flags appear.
        const f = flags.stats();
        const inGroups = msg.groups.reduce((a, g) => a + g.ids.length, 0);
        console.info(
          `[delve—tective] Repeated comments (${site.name}): ${s.comments.length} comments loaded, ` +
            `${msg.groups.length} repeat groups (${inGroups} comments). On the page: ${f.onPage} comments, ` +
            `${f.withId} with ids, ${f.inGroups} in groups, ${f.flagged} flagged` +
            (f.noHeader ? `, ${f.noHeader} with no place for a flag` : '') + '.',
        );
      }
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
    }
  };

  /** Send new comments to the worker and ask for groups: quick passes while loading, one full pass at the end. */
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

  async function start(id: string) {
    const myRun = ++run;
    const live = () => myRun === run && !destroyed;
    flags.clear();
    const s: Scan = { run: myRun, comments: [], seen: new Set(), sent: 0, apiResolve: null, finalApplied: false };
    scan = s;

    // 1. Official API through the worker, when the site has one and a key is saved.
    let status = 'no api';
    if (site.tryApi) {
      status = await new Promise<string>((resolve) => {
        s.apiResolve = resolve;
        if (!send({ type: 'copies/apiScan', run: myRun, videoId: id })) {
          s.apiResolve = null;
          resolve('worker unavailable');
        }
      });
      if (!live()) return;
    }
    // 2. The site's own requests. Comments already loaded through the API are skipped.
    if (status !== 'done') {
      try {
        await site.fetchAll(id, {
          isLive: live,
          onComments: (list) => {
            addComments(list);
            regroup(false);
          },
        });
      } catch (e) {
        if (live()) {
          const why = String((e as Error).message ?? e);
          const hint = site.name === 'Reddit' && why === 'HTTP 403' ? ' (Reddit only serves comment data to logged-in users)' : '';
          console.warn(`[delve—tective] ${site.name} comments stopped: ${why}${hint}`);
        }
      }
    }
    if (!live()) return;
    regroup(true);
  }

  // Follow in-app navigation (no full page load between videos or threads).
  let current: string | null = null;
  const check = () => {
    if (destroyed) return;
    const id = site.pageId(location.href);
    if (id === current) return;
    current = id;
    run++; // stops any scan in flight
    scan = null;
    flags.clear();
    if (id) void start(id);
  };
  if (site.navEvent) document.addEventListener(site.navEvent, check);
  const poll = window.setInterval(check, 1000);
  check();

  return {
    update() {
      /* only on/off matters, handled by the caller */
    },
    destroy() {
      destroyed = true;
      run++;
      if (site.navEvent) document.removeEventListener(site.navEvent, check);
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
