// Page mode (Screen 2): outline flagged chunks, hover box, corner badge. Progressive verdicts over a Port.
import type { PageInput, ReasonRef } from '../checks/types';
import type { PageVerdict, PageVerdictMsg, Settings } from '../engine/messages';
import { capitalize, fillReason, shortReason } from '../reasons/templates';
import { createBadge, type Badge } from '../ui/badge';
import { createOutlineLayer, type OutlineLayer } from '../ui/outline';
import { createTooltip, type Tooltip } from '../ui/tooltip';
import { extractPage, type Extracted } from './extract';
import type { Controller } from './search';

const isTextReason = (r: ReasonRef) => r.templateId.startsWith('text.');

function sentence(r: ReasonRef): string {
  const s = capitalize(fillReason(r));
  return s.endsWith('.') ? s : `${s}.`;
}

/** "On the shared junk-site list. 2 of 4 paragraphs outlined." */
// Spans index chunks, and a chunk is several merged <p>/<li> blocks, each outlined separately.
// Count the outlined page elements (what the reader sees), not chunks.
export function badgeSummary(v: PageVerdict, chunkEls?: HTMLElement[][]): string {
  const parts: string[] = [];
  const lead = v.reasons.find((r) => !isTextReason(r)) ?? (v.spans.length ? null : v.reasons[0]);
  if (lead) parts.push(sentence(lead));
  const outlined = chunkEls ? v.spans.reduce((n, s) => n + (chunkEls[s.chunkIndex]?.length ?? 0), 0) : v.spans.length;
  const total = chunkEls ? chunkEls.reduce((n, els) => n + els.length, 0) : v.chunkCount;
  if (outlined && total) {
    parts.push(`${outlined} of ${total} paragraph${total === 1 ? '' : 's'} outlined.`);
  }
  return parts.join(' ');
}

/** Hover-box reasons: chunk reasons first, then page-level reasons; up to three, de-duplicated. */
function hoverReasons(v: PageVerdict, chunkIndex: number): string[] {
  const span = v.spans.find((s) => s.chunkIndex === chunkIndex);
  const refs = [...(span?.reasons ?? []), ...v.reasons.filter((r) => r.templateId !== 'text.page')];
  const out: string[] = [];
  for (const r of refs) {
    const t = shortReason(r);
    if (t && !out.includes(t)) out.push(t);
    if (out.length === 3) break;
  }
  if (!out.length) out.push(shortReason({ templateId: 'text.chunk' }));
  return out;
}

function onIdle(fn: () => void) {
  const go = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2000 });
    else setTimeout(fn, 200);
  };
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}

export function startPage(url: string, domain: string, _initial: Settings): Controller {
  let destroyed = false;
  let port: chrome.runtime.Port | null = null;
  let extracted: Extracted | null = null;
  let verdict: PageVerdict | null = null;
  let badge: Badge | null = null;
  let outline: OutlineLayer | null = null;
  let tooltip: Tooltip | null = null;
  let badgeClosed = false;
  let outlinedKey = '';

  function render() {
    if (destroyed || !verdict || !extracted) return;
    const v = verdict;

    // Outlines for flagged chunks.
    const map = new Map<number, HTMLElement[]>();
    for (const s of v.spans) {
      const els = extracted.chunkEls[s.chunkIndex];
      if (els?.length) map.set(s.chunkIndex, els);
    }
    const key = [...map.keys()].sort((a, b) => a - b).join(',');
    if (map.size) {
      if (!tooltip) tooltip = createTooltip();
      if (!outline) {
        outline = createOutlineLayer({
          onEnter: (i, rect) => verdict && tooltip?.show(rect, hoverReasons(verdict, i)),
          onLeave: () => tooltip?.hide(),
        });
      }
      if (key !== outlinedKey) outline.set(map);
    } else if (outline) {
      outline.remove();
      outline = null;
      tooltip?.hide();
    }
    outlinedKey = key;

    // Corner badge: medium/high only, or "Setting up page checks…" while the model downloads.
    const show = !badgeClosed && (v.level === 'medium' || v.level === 'high' || (v.settingUp && !v.done));
    if (show) {
      if (!badge) {
        badge = createBadge({
          onSeeAll: () => void chrome.runtime.sendMessage({ type: 'popup/open' }).catch(() => {}),
          onClose: () => {
            badgeClosed = true;
          },
        });
      }
      badge.update({ level: v.level, segments: v.segments, summary: badgeSummary(v, extracted.chunkEls), settingUp: v.settingUp && !v.done });
    } else {
      badge?.update(null);
    }
  }

  function run() {
    extracted = extractPage(document);
    const input: PageInput = {
      target: 'page',
      url,
      domain,
      title: extracted.title,
      chunks: extracted.chunks,
      clues: extracted.clues,
    };
    try {
      port = chrome.runtime.connect({ name: 'page-check' });
    } catch (err) {
      console.debug('[unslop] page-check connect failed', err);
      return;
    }
    port.onMessage.addListener((msg: PageVerdictMsg) => {
      if (destroyed || msg?.type !== 'page/verdict') return;
      verdict = msg.verdict;
      render();
      if (msg.verdict.done) {
        port?.disconnect();
        port = null;
      }
    });
    port.onDisconnect.addListener(() => {
      void chrome.runtime.lastError;
      port = null;
    });
    port.postMessage({ type: 'page/check', input });
  }

  onIdle(() => {
    if (!destroyed) run();
  });

  // Back/forward cache: Chrome closes extension ports when the page is cached. Close ours first,
  // and re-run the check when the page is restored (the service worker cleared this tab's state).
  const onPageHide = (e: PageTransitionEvent) => {
    if (!e.persisted) return;
    port?.disconnect();
    port = null;
  };
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted && !destroyed) run();
  };
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);

  return {
    update() {
      /* page UI doesn't depend on mode; enabled/disabled handled by index.ts */
    },
    destroy() {
      destroyed = true;
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      port?.disconnect();
      port = null;
      outline?.remove();
      tooltip?.remove();
      badge?.remove();
      outline = null;
      tooltip = null;
      badge = null;
    },
  };
}
