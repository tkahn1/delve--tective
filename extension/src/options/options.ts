// "My sites" page: review and remove the user's own marked and trusted sites (local only).
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './options.css';
import { DEFAULT_SETTINGS, type Settings } from '../engine/messages';
import { YT_STORAGE } from '../checks/commentCopies/messages';

type ListKey = 'markedSites' | 'trustedSites';
let settings: Settings = { ...DEFAULT_SETTINGS };

async function send<T>(msg: unknown): Promise<T | undefined> {
  try {
    return (await chrome.runtime.sendMessage(msg)) as T;
  } catch {
    return undefined;
  }
}

function renderList(id: string, key: ListKey): void {
  const ul = document.getElementById(id)!;
  ul.textContent = '';
  const items = [...(settings[key] ?? [])].sort();
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No sites yet.';
    ul.appendChild(li);
    return;
  }
  for (const domain of items) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = domain;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.setAttribute('aria-label', `Remove ${domain}`);
    btn.addEventListener('click', () => void remove(key, domain));
    li.append(name, btn);
    ul.appendChild(li);
  }
}

function render(): void {
  renderList('marked', 'markedSites');
  renderList('trusted', 'trustedSites');
}

async function remove(key: ListKey, domain: string): Promise<void> {
  const next = await send<Settings>({ type: 'settings/set', patch: { [key]: (settings[key] ?? []).filter((d) => d !== domain) } });
  if (next) settings = { ...DEFAULT_SETTINGS, ...next };
  render();
}

chrome.runtime.onMessage.addListener((msg: { type?: string; settings?: Settings }) => {
  if (msg?.type === 'settings/changed' && msg.settings) {
    settings = { ...DEFAULT_SETTINGS, ...msg.settings };
    render();
  }
  return false;
});

void (async () => {
  const s = await send<Settings>({ type: 'settings/get' });
  if (s) settings = { ...DEFAULT_SETTINGS, ...s };
  render();
})();

// ---------- YouTube comments: optional API key + hidden developer toggle ----------
// Stored in chrome.storage.local (not in Settings, so the key is never broadcast to tabs).
const ytKey = document.getElementById('ytKey') as HTMLInputElement;
const ytStatus = document.getElementById('ytStatus')!;
const ytDev = document.getElementById('ytDev')!;
const ytUseApi = document.getElementById('ytUseApi') as HTMLInputElement;
const SAVED_HINT = 'Key saved. Paste a new one to replace it.';
let statusTimer = 0;
const ytSay = (t: string) => {
  ytStatus.textContent = t;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => (ytStatus.textContent = ''), 3000);
};

void chrome.storage.local.get([YT_STORAGE.apiKey, YT_STORAGE.devMode, YT_STORAGE.useApi]).then((s) => {
  if (s[YT_STORAGE.apiKey]) ytKey.placeholder = SAVED_HINT;
  ytDev.hidden = !s[YT_STORAGE.devMode];
  ytUseApi.checked = s[YT_STORAGE.useApi] !== false; // on unless turned off
});

document.getElementById('ytSave')!.addEventListener('click', async () => {
  const v = ytKey.value.trim();
  if (!v) return ytSay('Paste a key first.');
  await chrome.storage.local.set({ [YT_STORAGE.apiKey]: v });
  ytKey.value = '';
  ytKey.placeholder = SAVED_HINT;
  ytSay('Saved. Applies to the next video you open.');
});
document.getElementById('ytClear')!.addEventListener('click', async () => {
  await chrome.storage.local.remove(YT_STORAGE.apiKey);
  ytKey.placeholder = 'Paste a YouTube Data API key';
  ytSay('Key removed.');
});

// Hidden developer mode: click the "YouTube comments" heading 5 times within 3 seconds.
let clicks: number[] = [];
document.getElementById('ytTitle')!.addEventListener('click', async () => {
  const now = Date.now();
  clicks = clicks.filter((t) => now - t < 3000).concat(now);
  if (clicks.length >= 5 && ytDev.hidden) {
    clicks = [];
    ytDev.hidden = false;
    await chrome.storage.local.set({ [YT_STORAGE.devMode]: true });
    ytSay('Developer mode on.');
  }
});
ytUseApi.addEventListener('change', async () => {
  await chrome.storage.local.set({ [YT_STORAGE.useApi]: ytUseApi.checked });
  ytSay(ytUseApi.checked ? 'API on.' : 'API off: YouTube page requests only.');
});
// Hiding developer mode turns the API back on, so nothing stays switched off out of sight.
document.getElementById('ytExitDev')!.addEventListener('click', async () => {
  await chrome.storage.local.set({ [YT_STORAGE.devMode]: false, [YT_STORAGE.useApi]: true });
  ytUseApi.checked = true;
  ytDev.hidden = true;
});
