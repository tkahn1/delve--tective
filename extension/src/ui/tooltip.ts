// Dark hover box placed beside an outlined paragraph.
import { createShadowHost, h } from './shadow';
import { TOOLTIP_CSS } from './styles';

const WIDTH = 200;
const GAP = 10;

export interface Tooltip {
  /** rect is in viewport coordinates (getBoundingClientRect of the outlined block). */
  show(rect: DOMRect, reasons: string[]): void;
  hide(): void;
  remove(): void;
}

export function createTooltip(): Tooltip {
  const sh = createShadowHost(
    TOOLTIP_CSS,
    'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;',
  );
  // Minimal: a title, the reasons on one line, a short caveat.
  const list = h('p', { class: 'r' });
  const tip = h('div', { class: 'u tip', role: 'tooltip', hidden: '' },
    h('p', { class: 't' }, 'Worth a second look'),
    list,
    h('p', { class: 'fine' }, 'Checks can be wrong.'),
  );
  sh.root.appendChild(tip);
  document.documentElement.appendChild(sh.host);

  return {
    show(rect, reasons) {
      list.textContent = reasons.join(' · ');
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
        const tipH = tip.offsetHeight || 140;
        top = Math.max(sy + 8, Math.min(top, sy + window.innerHeight - tipH - 8));
      }
      tip.style.left = `${left + sx}px`;
      tip.style.top = `${top}px`;
    },
    hide() {
      tip.hidden = true;
    },
    remove: sh.remove,
  };
}
