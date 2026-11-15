// Service worker: owns storage, runs worker checks, routes engine checks to the offscreen document.
import type { Check, Evidence, PageInput, SpanFlag, TemplateId } from '../checks/types';
import { checks } from '../checks/registry';
import { config } from '../config/detectors.config';
import { combine, levelAtLeast } from '../combine/combine';
import { isAllowlisted, registrableDomain } from '../util/domain';
import { resolveUrl } from '../content/urlmap';
import { getStats, recordPage, recordResults } from '../storage/stats';
import {
  DEFAULT_SETTINGS,
  PAGE_CHECK_PORT,
  emptyPageVerdict,
  isEngineToWorker,
  tabStateKey,
  type EngineRequest,
  type EngineToWorker,
  type EngineStatus,
  type PageVerdict,
  type PageVerdictMsg,
  type ResultVerdict,
  type Settings,
  type SettingsChangedMsg,
  type TabState,
  type WorkerRequest,
} from '../engine/messages';

const FLAG_COLOR = '#EA580C';
const OFFSCREEN_PATH = 'src/engine/offscreen.html';
const ENGINE_TIMEOUT_MS = 90_000; // first model load can be slow
const SETTINGS_KEY = 'settings';

// ---------------------------------------------------------------- checks

const workerChecks = checks.filter((c) => c.runsIn === 'worker');
const engineChecks = checks.filter((c) => c.runsIn === 'engine');

let initPromise: Promise<void> | null = null;
function initWorkerChecks(): Promise<void> {
  initPromise ??= Promise.all(
    workerChecks.map((c) =>
      (c.init?.() ?? Promise.resolve()).catch((err) => console.warn(`[unslop] init ${c.id} failed`, err)),
    ),
  ).then(() => undefined);
  return initPromise;
}

async function runWorkerChecks(input: PageInput): Promise<Evidence[]> {
  await initWorkerChecks();
  const applicable = workerChecks.filter((c: Check) => c.targets.includes(input.target));
  const out = await Promise.all(
    applicable.map((c) =>
      c.run(input).catch((err) => {
        console.warn(`[unslop] check ${c.id} failed`, err);
        return null;
      }),
    ),
  );
  return out.filter((e): e is Evidence => !!e);
}

// ---------------------------------------------------------------- settings

let settingsCache: Settings | null = null;

async function getSettings(): Promise<Settings> {
  if (settingsCache) return settingsCache;
  const got = await chrome.storage.local.get(SETTINGS_KEY);
  settingsCache = { ...DEFAULT_SETTINGS, ...((got?.[SETTINGS_KEY] as Partial<Settings>) ?? {}) };
  return settingsCache;
}

async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next: Settings = { ...(await getSettings()), ...patch };
  next.disabledSites = Array.from(new Set((next.disabledSites ?? []).map((s) => s.toLowerCase())));
  next.markedSites = Array.from(new Set((next.markedSites ?? []).map((s) => s.toLowerCase())));
  next.trustedSites = Array.from(new Set((next.trustedSites ?? []).map((s) => s.toLowerCase())));
  if (!['relaxed', 'balanced', 'strict'].includes(next.sensitivity)) next.sensitivity = 'balanced';
  settingsCache = next;
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  broadcastSettings(next);
  return next;
}

function broadcastSettings(settings: Settings): void {
  const msg: SettingsChangedMsg = { type: 'settings/changed', settings };
  chrome.tabs.query({}).then((tabs) => {
    for (const t of tabs) if (t.id !== undefined) chrome.tabs.sendMessage(t.id, msg).catch(() => {});
  });
  chrome.runtime.sendMessage(msg).catch(() => {});
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) settingsCache = null;
});

function isSiteDisabled(settings: Settings, domain: string): boolean {
  if (!settings.enabled) return true;
  const d = domain.toLowerCase();
  return settings.disabledSites.some((s) => d === s || d.endsWith('.' + s));
}

/** Domain of the page that sent a message, honoring the saved-page URL map. */
function senderDomain(sender: chrome.runtime.MessageSender): string {
  const raw = sender.tab?.url ?? sender.url ?? '';
  try {
    return registrableDomain(new URL(resolveUrl(raw)).hostname);
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------- tab state + badge

async function setTabState(tabId: number, state: TabState): Promise<void> {
  await chrome.storage.session.set({ [tabStateKey(tabId)]: state });
  let text = '';
  if (state.kind === 'search') text = state.dimmed > 0 ? String(state.dimmed) : '';
  else text = levelAtLeast(state.level, 'medium') ? ' ' : '';
  await setBadge(tabId, text);
}

async function setBadge(tabId: number, text: string): Promise<void> {
  try {
    await chrome.action.setBadgeText({ tabId, text });
    if (text) {
      await chrome.action.setBadgeBackgroundColor({ tabId, color: FLAG_COLOR });
      await chrome.action.setBadgeTextColor?.({ tabId, color: '#FFFFFF' });
    }
  } catch {
    /* tab closed */
  }
}

async function getTabState(tabId: number): Promise<TabState | null> {
  const key = tabStateKey(tabId);
  const got = await chrome.storage.session.get(key);
  return (got?.[key] as TabState | undefined) ?? null;
}

async function clearTab(tabId: number): Promise<void> {
  await chrome.storage.session.remove([tabStateKey(tabId), searchKey(tabId)]).catch(() => {});
  await setBadge(tabId, '');
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  // A real navigation: drop the old page's state; the content script will report again.
  if (info.status === 'loading' && info.url) {
    clearTab(tabId);
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  clearTab(tabId);
  chrome.storage.session.remove(seenKey(tabId)).catch(() => {});
});

// ---------------------------------------------------------------- search results

/** Per-tab search page bookkeeping (session storage): which results on the current page are dimmed. */
interface SearchMeta {
  pageUrl: string;
  all: string[];
  flagged: string[];
}
const searchKey = (tabId: number) => `search:${tabId}`;
/** Result URLs already counted in stats for this tab (dedupe across re-checks and reloads). */
const seenKey = (tabId: number) => `seen:${tabId}`;

/** Sites the user marked as slop count as listed for them (local only). */
function isUserMarked(settings: Settings, domain: string): boolean {
  const d = domain.toLowerCase();
  return (settings.markedSites ?? []).some((s) => d === s || d.endsWith('.' + s));
}
function isUserTrusted(settings: Settings, domain: string): boolean {
  const d = domain.toLowerCase();
  return (settings.trustedSites ?? []).some((s) => d === s || d.endsWith('.' + s));
}
function userMarkEvidence(settings: Settings, domain: string): Evidence[] {
  return isUserMarked(settings, domain)
    ? [{ checkId: 'siteList', score: 1, confidence: 'high', reasons: [{ templateId: 'siteList.user' }] }]
    : [];
}

async function checkResult(input: PageInput, settings: Settings): Promise<ResultVerdict> {
  const none: ResultVerdict = { flagged: false, level: null, reasons: [] };
  if (!input.domain || isSiteDisabled(settings, input.domain) || isUserTrusted(settings, input.domain)) return none;
  const marked = userMarkEvidence(settings, input.domain);
  if (!marked.length && isAllowlisted(input.domain)) return none;
  const evidence = [...(await runWorkerChecks(input)), ...marked];
  const c = combine(evidence);
  return {
    flagged: levelAtLeast(c.level, config.resultFlagLevel),
    level: c.level,
    reasons: c.reasons.slice(0, config.maxResultReasons),
  };
}

async function handleSearchCheck(
  results: PageInput[],
  sender: chrome.runtime.MessageSender,
): Promise<{ verdicts: ResultVerdict[] }> {
  const settings = await getSettings();
  const pageDomain = senderDomain(sender);
  if (!settings.enabled || (pageDomain && isSiteDisabled(settings, pageDomain))) {
    return { verdicts: results.map(() => ({ flagged: false, level: null, reasons: [] })) };
  }

  const verdicts = await Promise.all(results.map((r) => checkResult(r, settings)));

  const tabId = sender.tab?.id;
  if (tabId !== undefined && tabId >= 0) {
    updateSearchState(tabId, sender.tab?.url ?? '', pageDomain, results, verdicts).catch((err) =>
      console.warn('[unslop] search state', err),
    );
  }
  return { verdicts };
}

async function updateSearchState(
  tabId: number,
  pageUrl: string,
  pageDomain: string,
  results: PageInput[],
  verdicts: ResultVerdict[],
): Promise<void> {
  const sKey = searchKey(tabId);
  const kKey = seenKey(tabId);
  const got = await chrome.storage.session.get([sKey, kKey]);
  const prev = got?.[sKey] as SearchMeta | undefined;
  const meta: SearchMeta = prev && prev.pageUrl === pageUrl ? prev : { pageUrl, all: [], flagged: [] };
  const all = new Set(meta.all);
  const flagged = new Set(meta.flagged);
  const seen = new Set<string>((got?.[kKey] as string[] | undefined) ?? []);
  const newlyFlagged: { domain: string; templateIds: TemplateId[] }[] = [];

  results.forEach((r, i) => {
    all.add(r.url);
    const v = verdicts[i];
    if (!v?.flagged) return;
    flagged.add(r.url);
    if (!seen.has(r.url)) {
      seen.add(r.url);
      newlyFlagged.push({ domain: r.domain, templateIds: v.reasons.map((x) => x.templateId) });
    }
  });

  await chrome.storage.session.set({
    [sKey]: { pageUrl, all: [...all], flagged: [...flagged] } satisfies SearchMeta,
    [kKey]: [...seen],
  });
  await setTabState(tabId, {
    kind: 'search',
    domain: pageDomain,
    level: null,
    segments: 0,
    reasons: [],
    dimmed: flagged.size,
    total: all.size,
  });
  if (newlyFlagged.length) await recordResults(newlyFlagged);
}

// ---------------------------------------------------------------- offscreen engine

let engineStatus: EngineStatus | 'unknown' = 'unknown';
let creatingOffscreen: Promise<void> | null = null;

async function hasOffscreen(): Promise<boolean> {
  try {
    const url = chrome.runtime.getURL(OFFSCREEN_PATH);
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
      documentUrls: [url],
    });
    return contexts.length > 0;
  } catch {
    return false;
  }
}

async function ensureOffscreen(): Promise<void> {
  if (await hasOffscreen()) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_PATH,
        reasons: ['WORKERS' as chrome.offscreen.Reason],
        justification: 'Runs the on-device text check (ONNX model) off the main thread.',
      })
      .catch((err: unknown) => {
        // "Only a single offscreen document may be created" => already there.
        if (!String(err).includes('single offscreen')) throw err;
      })
      .finally(() => {
        creatingOffscreen = null;
      });
  }
  await creatingOffscreen;
}

async function sendToEngine(msg: EngineRequest): Promise<void> {
  await ensureOffscreen();
  try {
    await chrome.runtime.sendMessage(msg);
  } catch {
    // Listener may not be ready yet right after creation; retry once.
    await new Promise((r) => setTimeout(r, 300));
    await chrome.runtime.sendMessage(msg).catch(() => {});
  }
}

async function warmup(): Promise<void> {
  if (!engineChecks.length) return;
  try {
    await sendToEngine({ target: 'engine', type: 'engine/warmup' });
  } catch (err) {
    console.warn('[unslop] warmup failed', err);
  }
}

// ---------------------------------------------------------------- page check (Port 'page-check')

interface PendingPage {
  reqId: string;
  port: chrome.runtime.Port;
  tabId: number | undefined;
  input: PageInput;
  worker: Evidence[];
  engine: Evidence | null;
  timer: ReturnType<typeof setTimeout>;
  finished: boolean;
}
const pending = new Map<string, PendingPage>();
let reqCounter = 0;

function buildVerdict(input: PageInput, allEvidence: Evidence[], done: boolean): PageVerdict {
  // Sensitivity (popup): relaxed = ignore the text check; balanced = outlines only when the page is
  // Medium/High (plain human text such as Wikipedia got outlined at Low); strict = outline whenever
  // the text check flagged enough paragraphs, whatever the page level.
  const sensitivity = settingsCache?.sensitivity ?? 'balanced';
  const evidence = sensitivity === 'relaxed' ? allEvidence.filter((e) => e.checkId !== 'text') : allEvidence;
  const c = combine(evidence);
  const showText = sensitivity === 'strict' || c.level === 'medium' || c.level === 'high';
  const spans: SpanFlag[] = showText
    ? evidence.flatMap((e) => e.spans ?? []).sort((a, b) => a.chunkIndex - b.chunkIndex)
    : [];
  return {
    level: c.level,
    segments: c.segments,
    reasons: showText ? c.reasons : c.reasons.filter((r) => !r.templateId.startsWith('text.')),
    spans,
    chunkCount: input.chunks?.length ?? 0,
    done,
    settingUp: !done && engineStatus === 'loading',
  };
}

function post(port: chrome.runtime.Port, verdict: PageVerdict): void {
  try {
    port.postMessage({ type: 'page/verdict', verdict } satisfies PageVerdictMsg);
  } catch {
    /* port closed */
  }
}

async function finishPage(p: PendingPage): Promise<void> {
  if (p.finished) return;
  p.finished = true;
  clearTimeout(p.timer);
  pending.delete(p.reqId);
  const evidence = p.engine ? [...p.worker, p.engine] : p.worker;
  const verdict = buildVerdict(p.input, evidence, true);
  post(p.port, verdict);
  await completePage(p.tabId, p.input, verdict);
}

async function completePage(tabId: number | undefined, input: PageInput, verdict: PageVerdict): Promise<void> {
  if (tabId !== undefined && tabId >= 0) {
    await setTabState(tabId, {
      kind: 'page',
      domain: input.domain,
      level: verdict.level,
      segments: verdict.segments,
      reasons: verdict.reasons,
      dimmed: 0,
      total: 0,
    }).catch(() => {});
  }
  // Count page stats once per page check, when done.
  await recordPage({
    domain: input.domain,
    level: verdict.level,
    paragraphs: verdict.spans.length,
    templateIds: verdict.reasons.map((r) => r.templateId),
  }).catch((err) => console.warn('[unslop] stats', err));
}

async function handlePageCheck(port: chrome.runtime.Port, input: PageInput): Promise<void> {
  const tabId = port.sender?.tab?.id;
  const settings = await getSettings();

  const marked = input.domain ? userMarkEvidence(settings, input.domain) : [];
  if (
    !input.domain ||
    (!marked.length && isAllowlisted(input.domain)) ||
    isSiteDisabled(settings, input.domain) ||
    isUserTrusted(settings, input.domain)
  ) {
    post(port, emptyPageVerdict({ chunkCount: input.chunks?.length ?? 0 }));
    if (tabId !== undefined) {
      await setTabState(tabId, {
        kind: 'page',
        domain: input.domain,
        level: null,
        segments: 0,
        reasons: [],
        dimmed: 0,
        total: 0,
      }).catch(() => {});
    }
    return;
  }

  const worker = [...(await runWorkerChecks(input)), ...marked];
  const needsEngine =
    engineStatus !== 'unavailable' &&
    (input.chunks?.length ?? 0) > 0 &&
    engineChecks.some((c) => c.targets.includes(input.target));

  if (!needsEngine) {
    const verdict = buildVerdict(input, worker, true);
    post(port, verdict);
    await completePage(tabId, input, verdict);
    return;
  }

  const reqId = `r${Date.now().toString(36)}-${++reqCounter}`;
  const p: PendingPage = {
    reqId,
    port,
    tabId,
    input,
    worker,
    engine: null,
    finished: false,
    timer: setTimeout(() => {
      console.warn('[unslop] engine timed out; finishing with worker checks only');
      finishPage(p);
    }, ENGINE_TIMEOUT_MS),
  };
  pending.set(reqId, p);
  port.onDisconnect.addListener(() => {
    // Reading lastError marks it handled (e.g. "page moved into back/forward cache").
    void chrome.runtime.lastError;
    if (!p.finished) {
      p.finished = true;
      clearTimeout(p.timer);
      pending.delete(reqId);
    }
  });

  // Progressive: show worker-check results right away.
  post(port, buildVerdict(input, worker, false));

  try {
    await sendToEngine({ target: 'engine', type: 'engine/run', reqId, input });
  } catch (err) {
    console.warn('[unslop] engine unavailable', err);
    await finishPage(p);
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PAGE_CHECK_PORT) return;
  port.onMessage.addListener((msg: { type?: string; input?: PageInput }) => {
    if (msg?.type === 'page/check' && msg.input) {
      handlePageCheck(port, msg.input).catch((err) => {
        console.warn('[unslop] page check failed', err);
        post(port, emptyPageVerdict({ chunkCount: msg.input?.chunks?.length ?? 0 }));
      });
    }
  });
});

function handleEngineMessage(msg: EngineToWorker): void {
  switch (msg.type) {
    case 'engine/status': {
      engineStatus = msg.status;
      if (msg.status === 'unavailable') {
        for (const p of [...pending.values()]) finishPage(p);
      } else {
        // Refresh settingUp on in-flight checks.
        for (const p of pending.values()) {
          post(p.port, buildVerdict(p.input, p.engine ? [...p.worker, p.engine] : p.worker, false));
        }
      }
      break;
    }
    case 'engine/partial': {
      const p = pending.get(msg.reqId);
      if (!p || p.finished) return;
      if (engineStatus === 'loading' || engineStatus === 'unknown') engineStatus = 'ready';
      p.engine = msg.evidence;
      post(p.port, buildVerdict(p.input, [...p.worker, msg.evidence], false));
      break;
    }
    case 'engine/done': {
      const p = pending.get(msg.reqId);
      if (!p) return;
      if (engineStatus === 'loading' || engineStatus === 'unknown') engineStatus = 'ready';
      p.engine = msg.evidence;
      finishPage(p);
      break;
    }
  }
}

// ---------------------------------------------------------------- runtime messages

chrome.runtime.onMessage.addListener((msg: unknown, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return false;
  if (isEngineToWorker(msg)) {
    handleEngineMessage(msg);
    return false;
  }
  if ((msg as { target?: string }).target === 'engine') return false; // for the offscreen doc

  const req = msg as WorkerRequest;
  let work: Promise<unknown> | null = null;
  switch (req.type) {
    case 'search/check':
      work = handleSearchCheck(req.results ?? [], sender);
      break;
    case 'settings/get':
      work = getSettings();
      break;
    case 'settings/set':
      work = setSettings(req.patch ?? {});
      break;
    case 'popup/open':
      work = openPopup(sender.tab?.id);
      break;
    case 'tab/state':
      work = getTabState(req.tabId);
      break;
    case 'stats/get':
      work = getStats();
      break;
    default:
      return false;
  }
  work.then(sendResponse, (err) => {
    console.warn(`[unslop] ${req.type} failed`, err);
    sendResponse(null);
  });
  return true; // async response
});

async function openPopup(tabId: number | undefined): Promise<{ ok: boolean }> {
  try {
    await chrome.action.openPopup();
    return { ok: true };
  } catch {
    // TODO(hack): openPopup needs a focused window / user gesture on some Chrome versions.
    const q = tabId !== undefined ? `?tabId=${tabId}` : '';
    await chrome.tabs.create({ url: chrome.runtime.getURL(`src/popup/index.html${q}`) });
    return { ok: true };
  }
}

// ---------------------------------------------------------------- lifecycle

// Right-click menu: mark or trust the page's (or link's) site. Local only.
const MENU_MARK = 'unslop-mark';
const MENU_TRUST = 'unslop-trust';
function createMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_MARK, title: 'Mark site as slop', contexts: ['page', 'link'] });
    chrome.contextMenus.create({ id: MENU_TRUST, title: 'Trust this site', contexts: ['page', 'link'] });
  });
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const raw = info.linkUrl || info.pageUrl || tab?.url || '';
  let domain = '';
  try {
    domain = registrableDomain(new URL(resolveUrl(raw)).hostname);
  } catch {
    return;
  }
  if (!domain) return;
  void (async () => {
    const s = await getSettings();
    const marked = (s.markedSites ?? []).filter((d) => d !== domain);
    const trusted = (s.trustedSites ?? []).filter((d) => d !== domain);
    if (info.menuItemId === MENU_MARK) await setSettings({ markedSites: [...marked, domain], trustedSites: trusted });
    if (info.menuItemId === MENU_TRUST) await setSettings({ trustedSites: [...trusted, domain], markedSites: marked });
  })();
});

chrome.runtime.onInstalled.addListener(() => {
  initWorkerChecks();
  warmup();
  createMenus();
});
chrome.runtime.onStartup.addListener(() => {
  initWorkerChecks();
  warmup();
});
