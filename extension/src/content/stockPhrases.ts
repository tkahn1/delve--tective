// Highlight listed stock phrases inside outlined paragraphs (only those). Facts only: each
// highlight is an exact match against src/checks/text/stock_phrases.json, a fixed list with
// published evidence of over-use in AI-written text. It does not claim a word was generated.
//
// Drawn with the CSS Custom Highlight API: no page DOM is modified, ranges just get a
// quiet translucent fill.
import list from '../checks/text/stock_phrases.json';

const HIGHLIGHT = 'unslop-stock';
const STYLE_ID = 'unslop-stock-style';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function entrySource(entry: string): string {
  const star = entry.endsWith('*');
  const words = entry.replace(/\*$/, '').trim().split(/\s+/);
  let src = words.map((w) => esc(w).replace(/'/g, "['’]")).join('\\s+');
  if (star) src += '\\p{L}*';
  return src;
}

const ENTRIES = [...list.measured, ...list.documented].sort((a, b) => b.length - a.length);
const PHRASE_RE = new RegExp(`(?<![\\p{L}\\p{N}])(?:${ENTRIES.map(entrySource).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

/** Pure text matching (unit-tested): listed phrases with their character spans. */
export function matchStockPhrases(text: string): { start: number; end: number; phrase: string }[] {
  const out: { start: number; end: number; phrase: string }[] = [];
  PHRASE_RE.lastIndex = 0;
  for (let m = PHRASE_RE.exec(text); m; m = PHRASE_RE.exec(text)) {
    out.push({ start: m.index, end: m.index + m[0].length, phrase: m[0].toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ') });
  }
  return out;
}

export interface StockMatch {
  ranges: Range[];
  /** Matched phrases as written (lowercased, de-duplicated), in page order. */
  phrases: string[];
}

/** Find listed phrases in one element's visible text. */
export function findStockPhrases(el: HTMLElement): StockMatch {
  const nodes: { node: Text; start: number }[] = [];
  let text = '';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('script,style,noscript') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    nodes.push({ node: n, start: text.length });
    text += n.data;
  }
  const ranges: Range[] = [];
  const phrases: string[] = [];
  if (!text) return { ranges, phrases };
  const locate = (pos: number, end: boolean) => {
    // Node containing pos (for an end position, the node where it closes).
    let i = nodes.length - 1;
    while (i > 0 && (end ? nodes[i].start >= pos : nodes[i].start > pos)) i--;
    return { node: nodes[i].node, offset: pos - nodes[i].start };
  };
  for (const m of matchStockPhrases(text)) {
    const a = locate(m.start, false);
    const b = locate(m.end, true);
    try {
      const r = document.createRange();
      r.setStart(a.node, a.offset);
      r.setEnd(b.node, b.offset);
      ranges.push(r);
    } catch {
      continue;
    }
    if (!phrases.includes(m.phrase)) phrases.push(m.phrase);
  }
  return { ranges, phrases };
}

const supported = () => typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';

// Quiet translucent fill in the outline's colour family (C.flag #8c5c38). No hover effect and
// nothing in the hover box: it is a visual cue only.
const FILL = 'rgba(140, 92, 56, 0.16)';

/** Replace the highlighted ranges (pass [] to clear). */
export function setStockHighlights(ranges: Range[]): void {
  if (!supported()) return;
  if (!ranges.length) {
    CSS.highlights.delete(HIGHLIGHT);
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-unslop-ui', '');
    style.textContent = `::highlight(${HIGHLIGHT}) { background-color: ${FILL}; }`;
    (document.head ?? document.documentElement).appendChild(style);
  }
  CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges));
}
