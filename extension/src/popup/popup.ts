import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './popup.css';

import type { Settings, TabState } from '../engine/messages';
import type { Level, ReasonRef } from '../checks/types';
import { fillReason, capitalize } from '../reasons/templates';
import { summarize, type Stats } from '../storage/stats';
import { registrableDomain } from '../util/domain';
import { logoTile, chevronIcon } from '../ui/icons';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const LEVEL_LABEL: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' };

let settings: Settings = { enabled: true, mode: 'dim', disabledSites: [], markedSites: [] };
let siteDomain = '';
let activeTabId: number | undefined;

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
    body.appendChild(el('p', 'muted', 'Unslop is off.'));
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

  if (!state || !state.level || state.level === 'low' && !state.reasons.length) {
    body.appendChild(el('p', 'clean', 'Nothing flagged on this page.'));
    return;
  }
  body.appendChild(el('h1', 'headline', `Second look: ${LEVEL_LABEL[state.level]}`));
  body.appendChild(meter(state.segments));
  if (state.reasons.length) body.appendChild(reasonList(state.reasons));
}

function renderSettings(): void {
  ($('enabled') as HTMLInputElement).checked = settings.enabled;
  document.querySelectorAll<HTMLButtonElement>('.segmented button').forEach((b) => {
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
    btn.setAttribute('aria-label', marked ? `Unmark ${siteDomain}` : `Mark ${siteDomain} as slop for you`);
  }
  document.body.classList.toggle('off', !settings.enabled);
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
  renderSettings();
  renderPage(state);
}

async function refreshStats(): Promise<void> {
  const stats = await send<Stats>({ type: 'stats/get' });
  const totals = stats ? summarize(stats, 'week').totals : { dimmed: 0, pagesFlagged: 0 };
  $('count-dimmed').textContent = String(totals.dimmed);
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
  document.querySelectorAll<HTMLButtonElement>('.segmented button').forEach((b) => {
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
    void setSettings({ markedSites: marked ? list.filter((d) => d !== siteDomain) : [...list, siteDomain] });
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
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.stats) void refreshStats();
    if (area === 'session' && activeTabId != null && changes[`tab:${activeTabId}`]) void refreshPage();
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id;
  siteDomain = domainFromUrl(tab?.url);

  const s = await send<Settings>({ type: 'settings/get' });
  if (s) settings = s;
  renderSettings();
  await Promise.all([refreshPage(), refreshStats()]);
}

void init();
