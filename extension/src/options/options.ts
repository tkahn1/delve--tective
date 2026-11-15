// "My sites" page: review and remove the user's own marked and trusted sites (local only).
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './options.css';
import { DEFAULT_SETTINGS, type Settings } from '../engine/messages';

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
