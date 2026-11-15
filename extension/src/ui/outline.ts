// Dashed outlines around flagged chunks, drawn as absolutely positioned boxes in one shadow
// host (pointer-events none). Hover/focus is tracked on the page's own paragraph elements.
//
// A chunk (what the text check scores) can span several short page elements, e.g. a run of
// <li>s. Scoring stays per chunk, but everything the user sees is per element: each element
// gets its own box, hovering highlights only that box, and the hover box is placed beside it.
import { createShadowHost, h } from './shadow';
import { OUTLINE_CSS } from './styles';

const PAD_X = 10;
const PAD_Y = 6;
/** Minimum clear space between two neighbouring boxes, so they read as separate. */
const GAP = 6;
/** Extra left padding so an outside list marker (bullet/number) sits inside the box. */
const LIST_MARKER_PAD = 18;

interface Entry {
  chunkIndex: number;
  el: HTMLElement;
  box: HTMLDivElement;
  padLeft: number;
  addedTabindex: boolean;
  /** Last placed box rect in document coordinates. */
  rect: { left: number; top: number; right: number; bottom: number } | null;
  cleanup: () => void;
}

export interface OutlineLayer {
  /** Replace the set of outlined chunks. */
  set(chunks: Map<number, HTMLElement[]>): void;
  reposition(): void;
  remove(): void;
}

function listMarkerPad(el: HTMLElement): number {
  if (el.tagName !== 'LI') return 0;
  try {
    const cs = getComputedStyle(el);
    return cs.listStylePosition === 'outside' && cs.listStyleType !== 'none' ? LIST_MARKER_PAD : 0;
  } catch {
    return 0;
  }
}

export function createOutlineLayer(opts: {
  onEnter(chunkIndex: number, rect: DOMRect): void;
  onLeave(chunkIndex: number): void;
}): OutlineLayer {
  // mix-blend-mode: multiply lets the flag tint sit "under" the page text without hiding it.
  const sh = createShadowHost(
    OUTLINE_CSS,
    'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483646;pointer-events:none;mix-blend-mode:multiply;',
  );
  const layer = h('div', { class: 'layer' });
  sh.root.appendChild(layer);
  document.documentElement.appendChild(sh.host);

  let entries: Entry[] = [];
  let raf = 0;

  /** The box rect of one entry, in viewport coordinates (for placing the hover box). */
  const viewportRect = (e: Entry): DOMRect => {
    if (!e.rect) {
      const rc = e.el.getBoundingClientRect();
      return new DOMRect(rc.left - PAD_X - e.padLeft, rc.top - PAD_Y, rc.width + PAD_X * 2 + e.padLeft, rc.height + PAD_Y * 2);
    }
    const { left, top, right, bottom } = e.rect;
    return new DOMRect(left - window.scrollX, top - window.scrollY, right - left, bottom - top);
  };

  const place = () => {
    raf = 0;
    const sx = window.scrollX;
    const sy = window.scrollY;
    // 1. Padded rect per element, plus the element's own (unpadded) top/bottom.
    const placed: { e: Entry; elTop: number; elBottom: number; r: NonNullable<Entry['rect']> }[] = [];
    for (const e of entries) {
      const rc = e.el.getBoundingClientRect();
      if (rc.width === 0 && rc.height === 0) {
        e.box.style.display = 'none';
        e.rect = null;
        continue;
      }
      const elTop = rc.top + sy;
      const elBottom = rc.bottom + sy;
      placed.push({
        e,
        elTop,
        elBottom,
        r: { left: rc.left + sx - PAD_X - e.padLeft, top: elTop - PAD_Y, right: rc.right + sx + PAD_X, bottom: elBottom + PAD_Y },
      });
    }
    // 2. Neighbouring boxes must not touch: split the space between two stacked elements
    //    and leave GAP between their boxes.
    placed.sort((a, b) => a.elTop - b.elTop);
    for (let i = 0; i + 1 < placed.length; i++) {
      const a = placed[i];
      const b = placed[i + 1];
      const overlapX = a.r.left < b.r.right && b.r.left < a.r.right;
      if (!overlapX || a.elBottom > b.elTop + 1) continue; // side by side, or elements overlap
      if (a.r.bottom + GAP <= b.r.top) continue; // already apart
      const mid = (a.elBottom + b.elTop) / 2;
      a.r.bottom = Math.min(a.r.bottom, mid - GAP / 2);
      b.r.top = Math.max(b.r.top, mid + GAP / 2);
    }
    // 3. Draw.
    for (const p of placed) {
      p.e.rect = p.r;
      const s = p.e.box.style;
      s.display = '';
      s.left = `${p.r.left}px`;
      s.top = `${p.r.top}px`;
      s.width = `${p.r.right - p.r.left}px`;
      s.height = `${Math.max(0, p.r.bottom - p.r.top)}px`;
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(place);
  };

  const clear = () => {
    for (const e of entries) {
      e.cleanup();
      e.box.remove();
    }
    entries = [];
  };

  window.addEventListener('resize', schedule, { passive: true });
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
  if (ro && document.body) ro.observe(document.body);
  // Late images/fonts shift layout without resizing the window.
  window.addEventListener('load', schedule, { once: true });

  return {
    set(chunks) {
      clear();
      for (const [chunkIndex, els] of chunks) {
        for (const el of els) {
          const box = h('div', { class: 'box' });
          layer.appendChild(box);
          const entry: Entry = {
            chunkIndex,
            el,
            box,
            padLeft: listMarkerPad(el),
            addedTabindex: !el.hasAttribute('tabindex'),
            rect: null,
            cleanup: () => {},
          };
          // Highlight and anchor to this element only, not the whole chunk.
          const enter = () => {
            box.classList.add('on');
            opts.onEnter(chunkIndex, viewportRect(entry));
          };
          const leave = () => {
            box.classList.remove('on');
            opts.onLeave(chunkIndex);
          };
          el.addEventListener('mouseenter', enter);
          el.addEventListener('mouseleave', leave);
          el.addEventListener('focus', enter);
          el.addEventListener('blur', leave);
          if (entry.addedTabindex) el.setAttribute('tabindex', '0');
          entry.cleanup = () => {
            el.removeEventListener('mouseenter', enter);
            el.removeEventListener('mouseleave', leave);
            el.removeEventListener('focus', enter);
            el.removeEventListener('blur', leave);
            if (entry.addedTabindex) el.removeAttribute('tabindex');
          };
          entries.push(entry);
        }
      }
      place();
    },
    reposition: schedule,
    remove() {
      clear();
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      sh.remove();
    },
  };
}
