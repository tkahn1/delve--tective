// Opened-page extraction: main-content paragraphs merged into 80-250 word chunks, plus DOM clues.
import type { DomClues } from '../checks/types';
import { config } from '../config/detectors.config';

export interface Extracted {
  title: string;
  chunks: string[];
  /** chunkEls[i] = the page elements that make up chunks[i] (for outlining). */
  chunkEls: HTMLElement[][];
  clues: DomClues;
}

const ROOT_SELECTORS = [
  'article',
  '[itemprop="articleBody"]',
  '.entry-content',
  '.post-content',
  '.article-body',
  'main',
  '[role="main"]',
].join(',');

const SKIP_ANCESTORS = [
  'nav', 'header', 'footer', 'aside', 'form', 'figcaption', 'button', 'select', 'textarea',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
  '[aria-hidden="true"]', '#comments', '.comments', '.comment-list', '.sidebar', '.widget',
  '.share', '.social', '.related', '.breadcrumb', '.toc', '#toc', '[data-unslop-ui]',
].join(',');

const BLOCK_SELECTOR = 'p, li, blockquote, dd';
const MAX_CHUNKS = 40; // TODO(hack): cap message size; text check samples config.text.maxChunks itself.
const MAX_MAIN_CANDIDATES = 50;

const words = (s: string): string[] => s.split(/\s+/).filter(Boolean);
const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

function blockWordCount(root: Element): number {
  let n = 0;
  for (const el of Array.from(root.querySelectorAll('p'))) n += words(el.textContent ?? '').length;
  return n;
}

function pickRoot(doc: Document): Element {
  const cands = Array.from(doc.querySelectorAll(ROOT_SELECTORS)).slice(0, MAX_MAIN_CANDIDATES);
  let best: Element | null = null;
  let bestN = 0;
  for (const c of cands) {
    const n = blockWordCount(c);
    if (n > bestN) {
      best = c;
      bestN = n;
    }
  }
  return best && bestN >= config.text.minWords ? best : doc.body ?? doc.documentElement;
}

function collectBlocks(root: Element): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))) {
    if (el.closest(SKIP_ANCESTORS)) continue;
    // Leaf-most blocks only (an <li> wrapping <p>s is handled through its <p>s).
    if (el.tagName !== 'P' && el.querySelector('p, li, blockquote')) continue;
    if (el.tagName === 'P' && el.parentElement?.closest('p')) continue;
    if (el.getClientRects().length === 0) continue; // not rendered
    if (!clean(el.textContent ?? '')) continue;
    out.push(el);
  }
  return out;
}

/** Merge consecutive blocks into chunks of chunkMin..chunkMax words; drop chunks under minWords. */
export function mergeBlocks(blocks: { text: string; el: HTMLElement }[]): { chunks: string[]; chunkEls: HTMLElement[][] } {
  const { chunkMin, chunkMax, minWords } = config.text;
  const chunks: string[] = [];
  const chunkEls: HTMLElement[][] = [];
  let cur: string[] = [];
  let curEls: HTMLElement[] = [];
  let curN = 0;

  const flush = () => {
    if (!curEls.length) return;
    let text = cur.join(' ');
    let n = curN;
    // Trailing short chunk: fold into the previous one if it still fits.
    if (n < minWords && chunks.length) {
      const prevN = words(chunks[chunks.length - 1]).length;
      if (prevN + n <= chunkMax) {
        chunks[chunks.length - 1] += ' ' + text;
        chunkEls[chunkEls.length - 1].push(...curEls);
        cur = []; curEls = []; curN = 0;
        return;
      }
    }
    if (n >= minWords) {
      if (n > chunkMax) {
        text = words(text).slice(0, chunkMax).join(' ');
        n = chunkMax;
      }
      chunks.push(text);
      chunkEls.push(curEls);
    }
    cur = []; curEls = []; curN = 0;
  };

  for (const b of blocks) {
    const n = words(b.text).length;
    if (curN > 0 && curN + n > chunkMax) flush();
    cur.push(b.text);
    curEls.push(b.el);
    curN += n;
    if (curN >= chunkMin) flush();
    if (chunks.length >= MAX_CHUNKS) break;
  }
  if (chunks.length < MAX_CHUNKS) flush();
  return { chunks, chunkEls };
}

export function extractClues(doc: Document): DomClues {
  const generators = new Set<string>();
  for (const m of Array.from(doc.querySelectorAll('meta[name="generator" i]'))) {
    const v = (m.getAttribute('content') ?? '').trim().toLowerCase();
    if (v) generators.add(v);
  }
  const scriptHosts = new Set<string>();
  for (const s of Array.from(doc.querySelectorAll('script[src]'))) {
    try {
      const host = new URL(s.getAttribute('src') ?? '', doc.baseURI).hostname.toLowerCase();
      if (host) scriptHosts.add(host);
    } catch {
      /* ignore bad src */
    }
  }
  return { generators: [...generators], scriptHosts: [...scriptHosts] };
}

function pageTitle(doc: Document): string {
  const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const h1 = doc.querySelector('h1')?.textContent;
  return clean(og || h1 || doc.title || '');
}

export function extractPage(doc: Document = document): Extracted {
  const root = pickRoot(doc);
  const blocks = collectBlocks(root).map((el) => ({ el, text: clean(el.textContent ?? '') }));
  const { chunks, chunkEls } = mergeBlocks(blocks);
  return { title: pageTitle(doc), chunks, chunkEls, clues: extractClues(doc) };
}
