// Content script entry: top frame only. Picks search mode (Google results) or page mode.
import { DEFAULT_SETTINGS, type Settings, type SettingsChangedMsg } from '../engine/messages';
import { registrableDomain } from '../util/domain';
import { startPage } from './page';
import { startSearch, type Controller } from './search';
import { isGoogleSearch, resolveUrl } from './urlmap';

function siteDisabled(s: Settings, domain: string, hostname: string): boolean {
  const list = (s.disabledSites ?? []).map((d) => d.toLowerCase().replace(/^www\./, ''));
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return list.some((d) => d === domain || d === host || host.endsWith(`.${d}`));
}

async function getSettings(): Promise<Settings> {
  try {
    const s = (await chrome.runtime.sendMessage({ type: 'settings/get' })) as Settings | undefined;
    return s ? { ...DEFAULT_SETTINGS, ...s } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function main() {
  if (window.top !== window) return;
  if (location.protocol === 'chrome-extension:') return;
  if ((window as unknown as { __unslopLoaded?: boolean }).__unslopLoaded) return;
  (window as unknown as { __unslopLoaded?: boolean }).__unslopLoaded = true;

  const url = resolveUrl(location.href);
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    return;
  }
  const domain = registrableDomain(hostname);
  const kind: 'search' | 'page' = isGoogleSearch(url) ? 'search' : 'page';

  let controller: Controller | null = null;
  const apply = (s: Settings) => {
    const active = s.enabled && !siteDisabled(s, domain, hostname);
    if (!active) {
      controller?.destroy();
      controller = null;
      return;
    }
    if (controller) controller.update(s);
    else controller = kind === 'search' ? startSearch(url, s) : startPage(url, domain, s);
  };

  chrome.runtime.onMessage.addListener((msg: SettingsChangedMsg) => {
    if (msg?.type === 'settings/changed' && msg.settings) apply({ ...DEFAULT_SETTINGS, ...msg.settings });
    return false;
  });

  apply(await getSettings());
}

void main();
