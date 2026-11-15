// Dark hover box placed beside an outlined paragraph.
// Minimal by default: title, short reason labels on one line, short caveat. Hovering (or
// focusing) a label shows its one-line explanation under the labels; leaving it hides it again.
import { createShadowHost, h } from './shadow';
import { TOOLTIP_CSS } from './styles';

const WIDTH = 220;
const GAP = 10;
/** How long the box stays after the mouse leaves the paragraph, so it can be moved into the box. */
const HIDE_DELAY_MS = 250;

export interface TipReason {
  label: string;
  explain: string;
}

export interface Tooltip {
  /** rect is in viewport coordinates (getBoundingClientRect of the outlined block). */
  show(rect: DOMRect, reasons: TipReason[]): void;
  /** Hide after a short delay unless the mouse enters the box. */
  hideSoon(): void;
  hide(): void;
  remove(): void;
}

export function createTooltip(): Tooltip {
  const sh = createShadowHost(
    TOOLTIP_CSS,
    'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;',
  );
  const labels = h('p', { class: 'r' });
  const explain = h('p', { class: 'ex', hidden: '' });
  const tip = h('div', { class: 'u tip', role: 'tooltip', hidden: '' },
    h('p', { class: 't' }, 'Flagged'),
    labels,
    explain,
    h('p', { class: 'fine' }, 'Checks can be wrong.'),
  );
  sh.root.appendChild(tip);
  document.documentElement.appendChild(sh.host);

  let hideTimer = 0;
  const cancelHide = () => {
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = 0;
  };
  const hideNow = () => {
    cancelHide();
    tip.hidden = true;
    explain.hidden = true;
  };
  // While the mouse is inside the box, keep it open; leaving the box closes it.
  tip.addEventListener('mouseenter', cancelHide);
  tip.addEventListener('mouseleave', () => {
    hideTimer = window.setTimeout(hideNow, HIDE_DELAY_MS);
  });

  const showExplain = (text: string) => {
    explain.textContent = text;
    explain.hidden = false;
  };
  const clearExplain = () => {
    explain.hidden = true;
  };

  return {
    show(rect, reasons) {
      cancelHide();
      labels.textContent = '';
      clearExplain();
      reasons.forEach((r, i) => {
        if (i > 0) labels.append(h('span', { class: 'sep', 'aria-hidden': 'true' }, ' · '));
        const el = h('span', { class: 'lbl', tabindex: '0', 'aria-description': r.explain }, r.label);
        el.addEventListener('mouseenter', () => showExplain(r.explain));
        el.addEventListener('mouseleave', clearExplain);
        el.addEventListener('focus', () => showExplain(r.explain));
        el.addEventListener('blur', clearExplain);
        labels.append(el);
      });
      tip.hidden = false;
      const vw = document.documentElement.clientWidth;
      const sx = window.scrollX;
      const sy = window.scrollY;
      let left: number;
      let top = rect.top + sy;
      let beside = true;
      if (rect.right + GAP + WIDTH <= vw - 8) left = rect.right + GAP;
      else if (rect.left - GAP - WIDTH >= 8) left = rect.left - GAP - WIDTH;
      else {
        // No room beside it: drop below, aligned to the paragraph.
        beside = false;
        left = Math.max(8, Math.min(rect.left, vw - WIDTH - 8));
        top = rect.bottom + sy + 8;
      }
      if (beside) {
        // Keep the box inside the viewport vertically.
        const tipH = tip.offsetHeight || 100;
        top = Math.max(sy + 8, Math.min(top, sy + window.innerHeight - tipH - 8));
      }
      tip.style.left = `${left + sx}px`;
      tip.style.top = `${top}px`;
    },
    hideSoon() {
      cancelHide();
      hideTimer = window.setTimeout(hideNow, HIDE_DELAY_MS);
    },
    hide: hideNow,
    remove: () => {
      cancelHide();
      sh.remove();
    },
  };
}
