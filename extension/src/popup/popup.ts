import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './popup.css';

import { DEFAULT_SETTINGS, type Settings, type TabState } from '../engine/messages';
import type { Level, ReasonRef } from '../checks/types';
import { fillReason, capitalize } from '../reasons/templates';
import { summarize, type Stats } from '../storage/stats';
import { registrableDomain } from '../util/domain';
import { logoTile, chevronIcon } from '../ui/icons';
import { YT_STORAGE, copiesStatusKey, type CopiesStatus } from '../checks/commentCopies/messages';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const LEVEL_LABEL: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' };

let settings: Settings = { ...DEFAULT_SETTINGS };
let siteDomain = '';
let activeTabId: number | undefined;
let lastState: TabState | null = null;
let lastCopies: CopiesStatus | null = null;

function send<T>(msg: unknown): Promise<T | null> {
  return chrome.runtime.sendMessage(msg).then(
    (r) => (r ?? null) as T | null,
    () => null,
  );
}

function el(tag: string, cls?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function meter(segments: number): HTMLElement {
  const m = el('div', 'meter');
  m.setAttribute('role', 'img');
  m.setAttribute('aria-label', `${segments} of 5`);
  for (let i = 0; i < 5; i++) m.appendChild(el('span', i < segments ? 'seg on' : 'seg'));
  return m;
}

function reasonList(reasons: ReasonRef[]): HTMLElement {
  const ul = el('ul', 'reasons');
  for (const r of reasons) ul.appendChild(el('li', undefined, '· ' + capitalize(fillReason(r))));
  return ul;
}

function renderPage(state: TabState | null): void {
  const body = $('page-body');
  body.replaceChildren();

  if (!settings.enabled) {
    body.appendChild(el('p', 'muted', 'delve—tective is off.'));
    return;
  }
  if (siteDomain && settings.disabledSites.includes(siteDomain)) {
    body.appendChild(el('p', 'muted', 'This site is skipped.'));
    return;
  }

  if (state?.kind === 'search') {
    if (!state.dimmed) {
      body.appendChild(el('p', 'clean', 'Nothing flagged on this page.'));
      return;
    }
    const verb = settings.mode === 'hide' ? 'hidden' : 'dimmed';
    body.appendChild(el('h1', 'headline', `${state.dimmed} of ${state.total} results ${verb}`));
    if (state.level) body.appendChild(meter(state.segments));
    if (state.reasons.length) body.appendChild(reasonList(state.reasons));
    return;
  }

  if (!state) {
    // On YouTube / Reddit the comments result below stands in for the page result.
    if (!lastCopies) body.appendChild(el('p', 'muted', 'No page check available. Refresh the page to try again.'));
    return;
  }
  if (!state.level || state.level === 'low' && !state.reasons.length) {
    body.appendChild(el('p', 'clean', 'Nothing flagged on this page.'));
    return;
  }
  body.appendChild(el('h1', 'headline', `Flag level: ${LEVEL_LABEL[state.level]}`));
  body.appendChild(meter(state.segments));
  if (state.reasons.length) body.appendChild(reasonList(state.reasons));
}

function renderSettings(): void {
  ($('enabled') as HTMLInputElement).checked = settings.enabled;
  document.querySelectorAll<HTMLButtonElement>('.segmented button[data-mode]').forEach((b) => {
    const on = b.dataset.mode === settings.mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
  const row = $('site-row');
  row.hidden = !siteDomain;
  if (siteDomain) {
    $('site-title').textContent = `Check ${siteDomain}`;
    const input = $('site-enabled') as HTMLInputElement;
    input.checked = !settings.disabledSites.includes(siteDomain);
    input.setAttribute('aria-label', `Check ${siteDomain}`);
    const marked = (settings.markedSites ?? []).includes(siteDomain);
    const btn = $('mark-site') as HTMLButtonElement;
    btn.textContent = marked ? 'Unmark' : 'Mark as slop';
    btn.setAttribute('aria-pressed', String(marked));
    btn.setAttribute('aria-label', marked ? `Unmark ${siteDomain}` : `Mark ${siteDomain} as slop`);
    const trusted = (settings.trustedSites ?? []).includes(siteDomain);
    const tbtn = $('trust-site') as HTMLButtonElement;
    tbtn.textContent = trusted ? 'Untrust' : 'Not slop';
    tbtn.setAttribute('aria-pressed', String(trusted));
    tbtn.setAttribute('aria-label', trusted ? `Stop trusting ${siteDomain}` : `Trust ${siteDomain}`);
  }
  document.querySelectorAll<HTMLButtonElement>('.segmented button[data-sens]').forEach((b) => {
    const on = b.dataset.sens === (settings.sensitivity ?? 'balanced');
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
  renderSensHelp(settings.sensitivity ?? 'balanced');
  document.body.classList.toggle('off', !settings.enabled);
}

/** What the selected Sensitivity does, for pages and for comments (matches service-worker.ts and keepGroup). */
const SENS_HELP: Record<Settings['sensitivity'], { lead: string; pages: string; comments: string }> = {
  relaxed: {
    lead: 'Fewest flags.',
    pages: 'only known junk sites and copied articles.',
    comments: 'only ones posted word for word 3 or more times.',
  },
  balanced: {
    lead: 'Recommended.',
    pages: 'suspect paragraphs are outlined when the page already looks like junk.',
    comments: 'any comment posted more than once.',
  },
  strict: {
    lead: 'Most flags, more false alarms.',
    pages: 'suspect paragraphs are outlined on any site.',
    comments: 'also catches reworded copies.',
  },
};

function renderSensHelp(s: Settings['sensitivity']): void {
  const help = SENS_HELP[s] ?? SENS_HELP.balanced;
  const box = $('sens-help');
  box.replaceChildren(
    el('span', 'sens-lead', help.lead),
    el('span', 'sens-line', `Pages: ${help.pages}`),
    el('span', 'sens-line', `Comments: ${help.comments}`),
  );
}

async function setSettings(patch: Partial<Settings>): Promise<void> {
  settings = { ...settings, ...patch };
  renderSettings();
  const next = await send<Settings>({ type: 'settings/set', patch });
  if (next) settings = next;
  renderSettings();
  await refreshPage();
}

async function refreshPage(): Promise<void> {
  const state = activeTabId != null ? await send<TabState>({ type: 'tab/state', tabId: activeTabId }) : null;
  if (state?.domain) siteDomain = state.domain;
  lastState = state;
  renderSettings();
  renderPage(state);
  renderCopies(lastCopies); // its wording follows Dim/Hide
}

async function refreshStats(): Promise<void> {
  const stats = await send<Stats>({ type: 'stats/get' });
  const totals = stats ? summarize(stats, 'week').totals : { dimmed: 0, pagesFlagged: 0, comments: 0 };
  // "Flagged results": dimmed search results plus repeated comments. Pages include videos / threads with repeats.
  $('count-dimmed').textContent = String(totals.dimmed + (totals.comments ?? 0));
  $('count-pages').textContent = String(totals.pagesFlagged);
}

function domainFromUrl(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return registrableDomain(u.hostname);
  } catch {
    return '';
  }
}

async function init(): Promise<void> {
  $('logo').innerHTML = logoTile(28);
  $('chevron').innerHTML = chevronIcon(18);

  $('enabled').addEventListener('change', (e) => {
    void setSettings({ enabled: (e.target as HTMLInputElement).checked });
  });
  document.querySelectorAll<HTMLButtonElement>('.segmented button[data-sens]').forEach((b) => {
    b.addEventListener('click', () => {
      const sensitivity = b.dataset.sens as Settings['sensitivity'];
      if (sensitivity !== settings.sensitivity) void setSettings({ sensitivity });
    });
  });
  document.querySelectorAll<HTMLButtonElement>('.segmented button[data-mode]').forEach((b) => {
    b.addEventListener('click', () => {
      const mode = b.dataset.mode as Settings['mode'];
      if (mode !== settings.mode) void setSettings({ mode });
    });
  });
  $('site-enabled').addEventListener('change', (e) => {
    if (!siteDomain) return;
    const on = (e.target as HTMLInputElement).checked;
    const rest = settings.disabledSites.filter((d) => d !== siteDomain);
    void setSettings({ disabledSites: on ? rest : [...rest, siteDomain] });
  });
  $('mark-site').addEventListener('click', () => {
    if (!siteDomain) return;
    const list = settings.markedSites ?? [];
    const marked = list.includes(siteDomain);
    const trusted = (settings.trustedSites ?? []).filter((d) => d !== siteDomain);
    void setSettings({ markedSites: marked ? list.filter((d) => d !== siteDomain) : [...list, siteDomain], trustedSites: trusted });
  });
  $('trust-site').addEventListener('click', () => {
    if (!siteDomain) return;
    const list = settings.trustedSites ?? [];
    const trusted = list.includes(siteDomain);
    const marked = (settings.markedSites ?? []).filter((d) => d !== siteDomain);
    void setSettings({ trustedSites: trusted ? list.filter((d) => d !== siteDomain) : [...list, siteDomain], markedSites: marked });
  });
  $('manage-link').addEventListener('click', () => {
    void chrome.runtime.openOptionsPage();
    window.close();
  });
  $('report-link').addEventListener('click', () => {
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/report/index.html') });
    window.close();
  });

  chrome.runtime.onMessage.addListener((msg: { type?: string; settings?: Settings }) => {
    if (msg?.type === 'settings/changed' && msg.settings) {
      settings = msg.settings;
      renderSettings();
      void refreshPage();
    }
  });
  $('dev-chevron').innerHTML = chevronIcon(18);
  $('dev-link').addEventListener('click', () => {
    const link = $('dev-link');
    const open = link.getAttribute('aria-expanded') !== 'true';
    link.setAttribute('aria-expanded', String(open));
    $('dev-panel').hidden = !open;
  });
  $<HTMLInputElement>('yt-use-api').addEventListener('change', (e) => {
    void chrome.storage.local.set({ [YT_STORAGE.useApi]: (e.target as HTMLInputElement).checked });
  });
  void refreshYtApi();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[YT_STORAGE.apiKey] || changes[YT_STORAGE.useApi])) void refreshYtApi();
    if (area === 'local' && changes.stats) void refreshStats();
    if (area === 'session' && activeTabId != null && changes[`tab:${activeTabId}`]) void refreshPage();
    if (area === 'session' && activeTabId != null && changes[copiesStatusKey(activeTabId)]) void refreshCopies();
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id;
  siteDomain = domainFromUrl(tab?.url);

  const s = await send<Settings>({ type: 'settings/get' });
  if (s) settings = s;
  renderSettings();
  await Promise.all([refreshPage(), refreshStats(), refreshCopies()]);
}

// ---------- Repeated comments (comment copies) ----------
const SOURCE_LABEL: Record<CopiesStatus['source'], string> = {
  api: 'YouTube Data API (100 per page)',
  page: 'YouTube page requests (20 per page)',
  json: 'Reddit JSON',
};
const NOTE_LABEL: Record<string, string> = { nokey: 'no key saved', disabled: 'off in developer options' };

async function refreshCopies(): Promise<void> {
  const st = activeTabId == null ? null
    : ((await chrome.storage.session.get(copiesStatusKey(activeTabId)))[copiesStatusKey(activeTabId)] as CopiesStatus | undefined) ?? null;
  const had = !!lastCopies;
  lastCopies = st;
  if (had !== !!st) renderPage(lastState); // "No page check available" only when there is no comments result either
  renderCopies(st);
}

function renderCopies(st: CopiesStatus | null): void {
  const section = $('copies');
  section.hidden = !st || !settings.enabled;
  const metrics = $('copies-metrics');
  metrics.textContent = '';
  const row = (k: string, v: string, warn = false) => {
    metrics.append(el('dt', '', k));
    metrics.append(el('dd', warn ? 'warn' : '', v));
  };
  if (!st) {
    row('Status', 'Not running on this tab (YouTube videos and Reddit threads only)');
    return;
  }
  const n = (x: number) => x.toLocaleString();
  const loaded = st.comments + st.replies;
  const where = st.site === 'Reddit' ? 'thread' : 'video';

  // Summary
  const head = $('copies-head');
  head.textContent = '';
  // Same phrasing as search results ("3 of 10 results dimmed"), following Dim/Hide and Sensitivity.
  const verb = settings.mode === 'hide' ? 'hidden' : 'dimmed';
  if (st.phase === 'stopped' && !loaded) head.append(`Couldn't load the comments on this ${where}`);
  else if (st.repeats) head.append(el('b', '', n(st.repeats)), ` repeated comments ${verb}`);
  else head.append(st.phase === 'loading' ? 'Checking comments…' : `No repeated comments on this ${where}`);
  const groups = st.repeatGroups === 1 ? '1 group' : `${n(st.repeatGroups)} groups`;
  $('copies-sub').textContent =
    st.phase === 'stopped' && st.fetch.lastError ? st.fetch.lastError
    : st.phase === 'loading' ? `${st.repeats ? `${groups} so far · ` : ''}${n(loaded)} comments loaded`
    : `${st.repeats ? `In ${groups} · ` : ''}${n(loaded)} comments checked in ${Math.round(st.secs)} s`;

  // Developer metrics
  row('Status', st.phase === 'loading' ? `loading, ${Math.round(st.secs)} s` : st.phase === 'done' ? `done in ${Math.round(st.secs)} s` : 'stopped', st.phase === 'stopped');
  row('Site / id', `${st.site} / ${st.pageId}`);
  row('Source', SOURCE_LABEL[st.source] + (st.apiNote ? ` (API: ${NOTE_LABEL[st.apiNote] ?? st.apiNote})` : ''));
  row('Loaded', `${n(st.comments)} comments + ${n(st.replies)} replies`);
  row('Requests', `${n(st.fetch.requests)}${st.fetch.retries ? `, ${n(st.fetch.retries)} retries` : ''}${st.fetch.lastStatus ? `, last HTTP ${st.fetch.lastStatus}` : ''}`,
    !!st.fetch.lastStatus && st.fetch.lastStatus >= 400);
  if (st.fetch.lastError) row('Last error', st.fetch.lastError, true);
  row('Groups', `${n(st.groups)} (${n(st.inGroups)} comments, largest ${n(st.biggest)})`);
  const sensLabel = { relaxed: 'Less', balanced: 'Normal', strict: 'More' }[settings.sensitivity ?? 'balanced'];
  row('Flagged at sensitivity', `${n(st.repeatGroups)} groups, ${n(st.repeats)} comments (${sensLabel})`);
  row('Grouping', `${n(st.lastGroupMs)} ms last pass`);
  row('On the page', `${n(st.onPage)} comments, ${n(st.withId)} with ids`, st.onPage > 0 && st.withId === 0);
  row('Flags', `${n(st.flagged)} of ${n(st.inGroupsOnPage)} in groups` + (st.noHeader ? `, ${n(st.noHeader)} with no place` : ''),
    st.inGroupsOnPage > st.flagged);
}

/** Developer row: whether YouTube comment copies use the saved API key (on) or YouTube's page requests (off). */
async function refreshYtApi(): Promise<void> {
  const s = await chrome.storage.local.get([YT_STORAGE.apiKey, YT_STORAGE.useApi]);
  const hasKey = Boolean(String(s[YT_STORAGE.apiKey] ?? '').trim());
  const useApi = s[YT_STORAGE.useApi] !== false;
  const input = $<HTMLInputElement>('yt-use-api');
  input.disabled = !hasKey;
  input.checked = hasKey && useApi;
  $('yt-api-status').textContent = !hasKey
    ? 'No key saved. Add one in My sites.'
    : useApi
      ? 'In use: comments load 100 per page'
      : 'Off: using YouTube page requests';
}

void init();
