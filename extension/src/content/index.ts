// Content script entry: top frame only. Picks search mode (Google results) or page mode.
import { DEFAULT_SETTINGS, type Settings, type SettingsChangedMsg } from '../engine/messages';
import { registrableDomain } from '../util/domain';
import { startPage } from './page';
import { startSearch, type Controller } from './search';
import { resolveUrl, searchEngineOf } from './urlmap';
import { config } from '../config/detectors.config';
import { startCommentCopies } from './copies/controller';
import { isReddit, redditSite } from './reddit/site';
import { isYouTube, youtubeSite } from './youtube/site';

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

/**
 * One running copy per tab. When the extension is reloaded or updated, Chrome cuts the old content script off
 * (chrome.runtime.id becomes undefined) but leaves it and its UI in the page. A dead copy removes its own flags so
 * nothing stale is left behind, and a fresh copy (next page load) replaces it instead of bowing out to it.
 * Re-injecting into open tabs was tried and fails: the build's loader can't import its chunk there.
 * The popup asks for a refresh instead (popup.ts, renderCopies).
 */
interface Instance {
  alive(): boolean;
  teardown(): void;
}
type UnslopWindow = Window & { __unslopInstance?: Instance };

/** Remove everything a content script put in the page (shadow hosts and dim/hide marks). */
function removeOurUi(): void {
  document.querySelectorAll('[data-unslop-ui]').forEach((e) => e.remove());
  for (const attr of ['data-unslop-dim', 'data-unslop-hidden']) {
    document.querySelectorAll(`[${attr}]`).forEach((e) => e.removeAttribute(attr));
  }
}

const extensionAlive = (): boolean => {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
};

async function main() {
  if (window.top !== window) return;
  if (location.protocol === 'chrome-extension:') return;
  const w = window as UnslopWindow;
  const prev = w.__unslopInstance;
  if (prev?.alive()) return; // already running
  prev?.teardown(); // left over from before the extension was reloaded
  // Clear anything an earlier copy left in the page, including builds that predate __unslopInstance.
  removeOurUi();

  const url = resolveUrl(location.href);
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    return;
  }
  const domain = registrableDomain(hostname);
  const engine = searchEngineOf(url);
  const kind: 'search' | 'page' = engine ? 'search' : 'page';

  let controller: Controller | null = null;
  // Comment copies (YouTube videos, Reddit threads) run alongside the page controller, under the same switches.
  let copies: Controller | null = null;
  const cc = config.commentCopies;
  const copiesSite = !cc.enabled
    ? null
    : isYouTube(hostname)
      ? youtubeSite
      : isReddit(hostname) && cc.reddit
        ? redditSite
        : null;
  let listsKey = '';
  const apply = (s: Settings) => {
    // Marking/trusting a site or changing sensitivity changes verdicts: start the check again.
    const key = JSON.stringify([s.markedSites, s.trustedSites, s.sensitivity]);
    if (controller && listsKey && key !== listsKey) {
      controller.destroy();
      controller = null;
    }
    listsKey = key;
    const active = s.enabled && !siteDisabled(s, domain, hostname);
    if (!active) {
      controller?.destroy();
      controller = null;
      copies?.destroy();
      copies = null;
      return;
    }
    if (copiesSite) {
      if (copies) copies.update(s);
      else copies = startCommentCopies(copiesSite, s);
    }
    if (controller) controller.update(s);
    else controller = kind === 'search' ? startSearch(url, s, engine ?? 'google') : startPage(url, domain, s);
  };

  let torn = false;
  const teardown = () => {
    if (torn) return;
    torn = true;
    window.clearInterval(watch);
    try {
      controller?.destroy();
    } catch {
      /* already cut off */
    }
    try {
      copies?.destroy();
    } catch {
      /* already cut off */
    }
    controller = null;
    copies = null;
  };
  w.__unslopInstance = { alive: () => !torn && extensionAlive(), teardown };
  // If the extension goes away under us, clean up our UI rather than leave dead flags in the page.
  const watch = window.setInterval(() => {
    if (extensionAlive()) return;
    teardown();
    removeOurUi();
  }, 2000);

  chrome.runtime.onMessage.addListener((msg: SettingsChangedMsg) => {
    if (msg?.type === 'settings/changed' && msg.settings) apply({ ...DEFAULT_SETTINGS, ...msg.settings });
    return false;
  });

  apply(await getSettings());
}

void main();
