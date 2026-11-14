// Dashed outlines around flagged chunks, drawn as absolutely positioned boxes in one shadow
// host (pointer-events none). Hover/focus is tracked on the page's own paragraph elements.
import { createShadowHost, h } from './shadow';
import { OUTLINE_CSS } from './styles';

const PAD_X = 10;
const PAD_Y = 6;

interface Entry {
  chunkIndex: number;
  el: HTMLElement;
  box: HTMLDivElement;
  addedTabindex: boolean;
  cleanup: () => void;
}

export interface OutlineLayer {
  /** Replace the set of outlined chunks. */
  set(chunks: Map<number, HTMLElement[]>): void;
  reposition(): void;
  remove(): void;
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

  const highlight = (chunkIndex: number, on: boolean) => {
    for (const e of entries) if (e.chunkIndex === chunkIndex) e.box.classList.toggle('on', on);
  };

  /** Union rect (viewport coords) of all boxes for a chunk. */
  const chunkRect = (chunkIndex: number): DOMRect => {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const e of entries) {
      if (e.chunkIndex !== chunkIndex) continue;
      const rc = e.el.getBoundingClientRect();
      l = Math.min(l, rc.left - PAD_X); t = Math.min(t, rc.top - PAD_Y);
      r = Math.max(r, rc.right + PAD_X); b = Math.max(b, rc.bottom + PAD_Y);
    }
    return new DOMRect(l, t, r - l, b - t);
  };

  const place = () => {
    raf = 0;
    const sx = window.scrollX;
    const sy = window.scrollY;
    for (const e of entries) {
      const rc = e.el.getBoundingClientRect();
      if (rc.width === 0 && rc.height === 0) {
        e.box.style.display = 'none';
        continue;
      }
      e.box.style.display = '';
      e.box.style.left = `${rc.left + sx - PAD_X}px`;
      e.box.style.top = `${rc.top + sy - PAD_Y}px`;
      e.box.style.width = `${rc.width + PAD_X * 2}px`;
      e.box.style.height = `${rc.height + PAD_Y * 2}px`;
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
          const enter = () => {
            highlight(chunkIndex, true);
            opts.onEnter(chunkIndex, chunkRect(chunkIndex));
          };
          const leave = () => {
            highlight(chunkIndex, false);
            opts.onLeave(chunkIndex);
          };
          el.addEventListener('mouseenter', enter);
          el.addEventListener('mouseleave', leave);
          el.addEventListener('focus', enter);
          el.addEventListener('blur', leave);
          const addedTabindex = !el.hasAttribute('tabindex');
          if (addedTabindex) el.setAttribute('tabindex', '0');
          const entry: Entry = {
            chunkIndex,
            el,
            box,
            addedTabindex,
            cleanup: () => {
              el.removeEventListener('mouseenter', enter);
              el.removeEventListener('mouseleave', leave);
              el.removeEventListener('focus', enter);
              el.removeEventListener('blur', leave);
              if (entry.addedTabindex) el.removeAttribute('tabindex');
            },
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
