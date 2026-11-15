// Comment copies on any supported site (YouTube videos, Reddit threads): loads every comment in the
// background, has the service worker group the copies, and flags each repeated comment on screen with how
// many times it appears. A CopiesSite says how to recognise a page, fetch its comments and place flags.
// Progress and debug numbers go to the worker as a CopiesStatus, which the popup shows.
import {
  COMMENT_COPIES_PORT,
  type CopiesRequest,
  type CopiesResponse,
  type CopiesStatus,
  type FetchStats,
} from '../../checks/commentCopies/messages';
import type { CopyGroup, VideoComment } from '../../checks/commentCopies/types';
import { config } from '../../config/detectors.config';
import type { Settings } from '../../engine/messages';
import { createCommentFlags, type FlagSite } from '../../ui/commentFlag';
import { createCopiesSummary, type SummaryPlacement } from '../../ui/copiesSummary';
import type { Controller } from '../search';

export interface FetchOptions {
  isLive(): boolean;
  onComments(comments: VideoComment[]): void;
  stats: FetchStats;
}

export interface CopiesSite {
  name: string;
  /** Page id (video id, post id) for this URL, or null when the page has no comments to check. */
  pageId(href: string): string | null;
  /** Ask the service worker to try the official API first (YouTube with a saved key). */
  tryApi: boolean;
  /** What the site's own requests are called in the status: YouTube 'page', Reddit 'json'. */
  ownSource: 'page' | 'json';
  /** DOM event the site fires on in-app navigation, if any (the URL is also polled). */
  navEvent?: string;
  fetchAll(id: string, o: FetchOptions): Promise<void>;
  flags: FlagSite;
  /** Where the summary card goes: top of the comment section. */
  summaryPlacement(): SummaryPlacement | null;
}

interface Scan {
  run: number;
  comments: VideoComment[];
  seen: Map<string, VideoComment>;
  sent: number;
  apiResolve: ((status: string) => void) | null;
  finalApplied: boolean;
  status: CopiesStatus;
  t0: number;
}

const STATUS_EVERY_MS = 1000;

/**
 * The popup's Sensitivity applies to comments too:
 *  relaxed:  only exact copies and shared names, repeated 3+ times;
 *  balanced: every group of 2+;
 *  strict:   every group of 2+, with looser near-copy matching (shared words >= 50% instead of 60%, and
 *            comments with 4+ meaningful words instead of 5).
 */
export function keepGroup(g: CopyGroup, sensitivity: Settings['sensitivity']): boolean {
  if (sensitivity === 'relaxed') return g.kind !== 'near' && g.ids.length >= 3;
  return g.ids.length >= config.commentCopies.minFlagCount;
}
const nearOptsFor = (s: Settings['sensitivity']) =>
  s === 'strict' ? { nearThreshold: 0.5, nearMinWords: 4 } : { nearThreshold: undefined, nearMinWords: undefined };

export function startCommentCopies(site: CopiesSite, initial: Settings): Controller {
  const cfg = config.commentCopies;
  let settings = initial;
  const flags = createCommentFlags(site.flags, settings.mode);
  let lastGroups: CopyGroup[] = [];
  const summary = createCopiesSummary(site.flags.where, () => site.summaryPlacement());
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

  // ---------- status for the popup ----------
  let statusTimer = 0;
  const pushStatus = (now = false) => {
    const s = scan;
    if (!s) return;
    const flush = () => {
      statusTimer = 0;
      if (scan !== s) return;
      const f = flags.stats();
      Object.assign(s.status, {
        onPage: f.onPage,
        withId: f.withId,
        inGroupsOnPage: f.inGroups,
        flagged: f.flagged,
        noHeader: f.noHeader,
        secs: (Date.now() - s.t0) / 1000,
        updatedAt: Date.now(),
      });
      send({ type: 'copies/status', status: { ...s.status, fetch: { ...s.status.fetch } } });
    };
    if (now) {
      window.clearTimeout(statusTimer);
      flush();
    } else if (!statusTimer) statusTimer = window.setTimeout(flush, STATUS_EVERY_MS);
  };

  const applyGroups = (s: Scan, groups: CopyGroup[], ms: number) => {
    lastGroups = groups;
    const kept = groups.filter((g) => keepGroup(g, settings.sensitivity));
    const byId = new Map<string, CopyGroup>();
    for (const g of kept) for (const id of g.ids) byId.set(id, g);
    flags.update(byId);
    s.status.repeats = kept.reduce((a, g) => a + g.ids.length, 0);
    s.status.repeatGroups = kept.length;
    summary.update({
      groups: kept,
      loaded: s.comments.length,
      loading: !s.finalApplied,
      sampleOf: (cid) => s.seen.get(cid)?.text,
    });
    s.status.groups = groups.length;
    s.status.inGroups = groups.reduce((a, g) => a + g.ids.length, 0);
    s.status.biggest = groups[0]?.ids.length ?? 0;
    s.status.lastGroupMs = Math.round(ms);
  };

  function onMessage(msg: CopiesResponse) {
    const s = scan;
    if (!s || msg.run !== s.run) return;
    if (msg.type === 'copies/groups') {
      if (!msg.final) busy = false;
      if (s.finalApplied && !msg.final) return;
      if (msg.final) s.finalApplied = true;
      applyGroups(s, msg.groups, msg.ms);
      if (msg.final) {
        if (s.status.phase === 'loading') s.status.phase = 'done';
        pushStatus(true);
        // One line per page in the console, to see where it stops if no flags appear.
        const st = s.status;
        console.info(
          `[delve—tective] Repeated comments (${site.name}): ${st.comments + st.replies} comments loaded, ` +
            `${st.groups} repeat groups (${st.inGroups} comments). On the page: ${st.onPage} comments, ` +
            `${st.withId} with ids, ${st.inGroupsOnPage} in groups, ${st.flagged} flagged` +
            (st.noHeader ? `, ${st.noHeader} with no place for a flag` : '') + '.',
        );
      } else pushStatus();
    } else if (msg.type === 'copies/api' && s.apiResolve) {
      if (msg.calls) s.status.fetch.requests = msg.calls;
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
      s.seen.set(c.id, c);
      s.comments.push(c);
      if (c.reply) s.status.replies++;
      else s.status.comments++;
    }
    pushStatus();
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
    const near = nearOptsFor(settings.sensitivity);
    if (final) {
      send({ type: 'copies/group', run: s.run, final: true, ...near });
      return;
    }
    const now = Date.now();
    if (busy || now - lastGroup < cfg.liveRegroupMs) return;
    lastGroup = now;
    busy = true;
    send({ type: 'copies/group', run: s.run, final: false, ...near });
  }

  async function start(id: string) {
    const myRun = ++run;
    const live = () => myRun === run && !destroyed;
    flags.clear();
    summary.clear();
    const status: CopiesStatus = {
      site: site.name, pageId: id, phase: 'loading', source: site.tryApi ? 'api' : site.ownSource, apiNote: null,
      comments: 0, replies: 0, groups: 0, inGroups: 0, repeats: 0, repeatGroups: 0, biggest: 0,
      onPage: 0, withId: 0, inGroupsOnPage: 0, flagged: 0, noHeader: 0,
      fetch: { requests: 0, retries: 0, lastStatus: null, lastError: null },
      lastGroupMs: 0, secs: 0, updatedAt: Date.now(),
    };
    const s: Scan = { run: myRun, comments: [], seen: new Map(), sent: 0, apiResolve: null, finalApplied: false, status, t0: Date.now() };
    scan = s;
    pushStatus(true);

    // 1. Official API through the worker, when the site has one and a key is saved.
    let result = 'no api';
    if (site.tryApi) {
      result = await new Promise<string>((resolve) => {
        s.apiResolve = resolve;
        if (!send({ type: 'copies/apiScan', run: myRun, videoId: id })) {
          s.apiResolve = null;
          resolve('worker unavailable');
        }
      });
      if (!live()) return;
      if (result !== 'done') {
        status.apiNote = result; // 'nokey', 'disabled' or the API's error reason
        status.fetch = { requests: 0, retries: 0, lastStatus: null, lastError: null };
      }
    }
    // 2. The site's own requests. Comments already loaded through the API are skipped.
    if (result !== 'done') {
      status.source = site.ownSource;
      pushStatus(true);
      try {
        await site.fetchAll(id, {
          isLive: live,
          stats: status.fetch,
          onComments: (list) => {
            addComments(list);
            regroup(false);
          },
        });
      } catch (e) {
        if (live()) {
          const why = String((e as Error).message ?? e);
          const hint = site.name === 'Reddit' && why === 'HTTP 403' ? ' (Reddit only serves comment data to logged-in users)' : '';
          status.phase = 'stopped';
          status.fetch.lastError = why + hint;
          console.warn(`[delve—tective] ${site.name} comments stopped: ${why}${hint}`);
        }
      }
    }
    if (!live()) return;
    regroup(true);
    pushStatus(true);
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
    summary.clear();
    if (id) void start(id);
    else send({ type: 'copies/status', status: null });
  };
  if (site.navEvent) document.addEventListener(site.navEvent, check);
  const poll = window.setInterval(check, 1000);
  check();

  return {
    // Same switches as search results: Dim/Hide applies to flagged comments, Sensitivity to which groups count.
    update(next) {
      const prev = settings;
      settings = next;
      flags.setMode(next.mode);
      if (next.sensitivity === prev.sensitivity || !scan) return;
      if ((next.sensitivity === 'strict') !== (prev.sensitivity === 'strict') && scan.finalApplied) {
        regroup(true); // near-copy threshold changed: group again in the worker
      } else if (scan.finalApplied || lastGroups.length) {
        applyGroups(scan, lastGroups, scan.status.lastGroupMs);
        pushStatus(true);
      }
    },
    destroy() {
      destroyed = true;
      run++;
      if (site.navEvent) document.removeEventListener(site.navEvent, check);
      window.clearInterval(poll);
      window.clearTimeout(statusTimer);
      flags.destroy();
      summary.destroy();
      try {
        port?.disconnect();
      } catch {
        /* already gone */
      }
      port = null;
    },
  };
}
