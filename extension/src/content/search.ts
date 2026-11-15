// Search mode (Screen 1): dim or hide flagged Google results, reason lines, summary bar.
import type { PageInput } from '../checks/types';
import type { ResultVerdict, SearchCheckResponse, Settings } from '../engine/messages';
import { fillReason } from '../reasons/templates';
import { ensurePageStyle, removePageStyle } from '../ui/shadow';
import { createHiddenLine, createReasonLine, createSummaryBar, type HiddenLine, type SummaryBar } from '../ui/summaryBar';
import { findBingResults, findYahooResults } from './engines/bing';
import { findResults as findGoogleResults, type ResultEl } from './engines/google';
import { queryOf, type EngineId } from './urlmap';

// Per-engine: how to find results, where to put the summary bar, what to watch for new results.
const ENGINES: Record<EngineId, { find(d: Document): ResultEl[]; anchor: string; root: string }> = {
  google: { find: findGoogleResults, anchor: '#rso', root: '#search, #rcnt' },
  bing: { find: findBingResults, anchor: '#b_results', root: '#b_content, #b_results' },
  yahoo: { find: findYahooResults, anchor: '#web', root: '#results, #web' },
};

export interface Controller {
  update(s: Settings): void;
  destroy(): void;
}

interface Item {
  res: ResultEl;
  verdict: ResultVerdict | null;
  shownAnyway: boolean;
  reasonLine: { host: HTMLElement; remove(): void } | null;
}

const DEBOUNCE_MS = 250;

export function startSearch(url: string, initial: Settings, engineId: EngineId = 'google'): Controller {
  const engine = ENGINES[engineId];
  let settings = initial;
  let destroyed = false;
  const query = queryOf(url);
  const items: Item[] = [];
  const seenContainers = new WeakSet<HTMLElement>();
  const seenUrls = new Set<string>();
  let bar: SummaryBar | null = null;
  let hiddenLine: HiddenLine | null = null;
  let hideRevealed = false;
  let timer = 0;

  ensurePageStyle();

  const flagged = () => items.filter((i) => i.verdict?.flagged);

  function clearResultLook(it: Item) {
    it.res.container.removeAttribute('data-unslop-dim');
    it.res.container.removeAttribute('data-unslop-hidden');
    it.reasonLine?.remove();
    it.reasonLine = null;
  }

  function render() {
    if (destroyed) return;
    const hide = settings.mode === 'hide' && !hideRevealed;
    const active = flagged().filter((i) => !i.shownAnyway);

    for (const it of items) {
      if (!it.verdict?.flagged || it.shownAnyway) {
        clearResultLook(it);
        continue;
      }
      if (hide) {
        it.res.container.setAttribute('data-unslop-hidden', '');
        it.res.container.removeAttribute('data-unslop-dim');
      } else {
        it.res.container.removeAttribute('data-unslop-hidden');
        it.res.container.setAttribute('data-unslop-dim', '');
      }
      if (!it.reasonLine) {
        // Template casing is kept (lowercase after the colon), as in the spec screenshot.
        const reasons = it.verdict.reasons.map((r) => fillReason(r)).filter(Boolean);
        const line = createReasonLine(reasons, () => {
          it.shownAnyway = true;
          render();
        });
        it.res.container.appendChild(line.host);
        it.reasonLine = line;
      }
    }

    // Hide mode: one collapsed line at the first flagged result's place.
    if (hide && active.length) {
      if (!hiddenLine) {
        hiddenLine = createHiddenLine(() => {
          hideRevealed = true;
          render();
        });
      }
      const first = active[0].res.container;
      if (hiddenLine.host.nextElementSibling !== first) first.parentElement?.insertBefore(hiddenLine.host, first);
      hiddenLine.update(active.length);
    } else if (hiddenLine) {
      hiddenLine.remove();
      hiddenLine = null;
    }

    // Summary bar above the results; not shown when nothing is flagged.
    const n = flagged().length;
    if (n > 0) {
      if (!bar) {
        bar = createSummaryBar((next) => {
          void chrome.runtime.sendMessage({ type: 'settings/set', patch: { mode: next } }).catch(() => {});
          // Apply locally right away; settings/changed will confirm.
          settings = { ...settings, mode: next };
          hideRevealed = false;
          render();
        });
      }
      if (!bar.host.isConnected) {
        const anchor = document.querySelector(engine.anchor) ?? items[0]?.res.container;
        anchor?.parentElement?.insertBefore(bar.host, anchor);
      }
      bar.update(n, items.length, settings.mode);
    } else if (bar) {
      bar.remove();
      bar = null;
    }
  }

  async function scan() {
    if (destroyed) return;
    const all = engine.find(document);
    const fresh = all.filter((r) => !seenContainers.has(r.container) && !seenUrls.has(r.url));
    if (!fresh.length) return;
    for (const r of fresh) {
      seenContainers.add(r.container);
      seenUrls.add(r.url);
    }
    const siblings = all.map((r) => ({ title: r.title, domain: r.domain }));
    const newItems: Item[] = fresh.map((res) => ({ res, verdict: null, shownAnyway: false, reasonLine: null }));
    items.push(...newItems);
    const results: PageInput[] = fresh.map((r) => ({
      target: 'result',
      url: r.url,
      domain: r.domain,
      title: r.title,
      query,
      siblings,
    }));
    try {
      const resp = (await chrome.runtime.sendMessage({ type: 'search/check', results })) as SearchCheckResponse | undefined;
      const verdicts = resp?.verdicts ?? [];
      newItems.forEach((it, i) => (it.verdict = verdicts[i] ?? null));
    } catch (err) {
      console.debug('[unslop] search/check failed', err);
    }
    render();
  }

  const observer = new MutationObserver((muts) => {
    // Ignore mutations that are only our own UI being inserted.
    const relevant = muts.some((m) =>
      Array.from(m.addedNodes).some((n) => n.nodeType === 1 && !(n as Element).hasAttribute('data-unslop-ui')),
    );
    if (!relevant) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => void scan(), DEBOUNCE_MS);
  });
  const obsRoot = document.querySelector(engine.root) ?? document.body;
  if (obsRoot) observer.observe(obsRoot, { childList: true, subtree: true });

  void scan();

  // Back/forward cache: the service worker cleared this tab's state on navigation; re-send what we
  // already annotated so the popup and toolbar count come back.
  async function resync() {
    if (destroyed || !items.length) return;
    const siblings = items.map((it) => ({ title: it.res.title, domain: it.res.domain }));
    const results: PageInput[] = items.map((it) => ({
      target: 'result',
      url: it.res.url,
      domain: it.res.domain,
      title: it.res.title,
      query,
      siblings,
    }));
    try {
      const resp = (await chrome.runtime.sendMessage({ type: 'search/check', results })) as SearchCheckResponse | undefined;
      const verdicts = resp?.verdicts ?? [];
      items.forEach((it, i) => (it.verdict = verdicts[i] ?? it.verdict));
    } catch (err) {
      console.debug('[unslop] search resync failed', err);
    }
    render();
  }
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) void resync();
  };
  window.addEventListener('pageshow', onPageShow);

  return {
    update(s) {
      const modeChanged = s.mode !== settings.mode;
      settings = s;
      if (modeChanged) hideRevealed = false;
      render();
    },
    destroy() {
      destroyed = true;
      window.removeEventListener('pageshow', onPageShow);
      observer.disconnect();
      clearTimeout(timer);
      for (const it of items) clearResultLook(it);
      hiddenLine?.remove();
      bar?.remove();
      hiddenLine = null;
      bar = null;
      removePageStyle();
    },
  };
}
