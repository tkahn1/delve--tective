import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './report.css';

import type { TemplateId } from '../checks/types';
import { summarize, type Stats } from '../storage/stats';

type Range = 'week' | 'month' | 'all';
type Summary = ReturnType<typeof summarize>;

// Short labels for report rows (no counts, since the report aggregates many pages).
const REASON_LABEL: Record<TemplateId, string> = {
  'siteList.listed': 'On the shared junk-site list',
  'siteList.user': 'Marked by you',
  'siteList.builder': 'Built with an AI site builder',
  'copy.sameArticle': 'Same article on other sites',
  'copy.sameTitle': 'Same title as other results',
  'text.page': 'Paragraphs flagged by the text check',
  'text.chunk': 'Flagged by the text check',
};
const reasonLabel = (id: string): string => REASON_LABEL[id as TemplateId] ?? id;

const SVG_NS = 'http://www.w3.org/2000/svg';
let range: Range = 'week';
let stats: Stats | null = null;

function el(tag: string, cls?: string, text?: string | number): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = String(text);
  return e;
}

function svgEl(tag: string, attrs: Record<string, string | number>, text?: string | number): SVGElement {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text != null) e.textContent = String(text);
  return e;
}

function tile(value: number, label: string, flag = false): HTMLElement {
  const t = el('div', flag ? 'tile flag' : 'tile');
  t.append(el('div', 'tile-num', value), el('div', 'tile-label', label));
  return t;
}

function barChart(daily: Summary['daily']): SVGElement {
  const W = 340;
  const H = 190;
  const top = 22;
  const bottom = 26;
  const n = Math.max(daily.length, 1);
  const slot = W / n;
  const barW = Math.min(44, slot * 0.72);
  const max = Math.max(1, ...daily.map((d) => d.value));
  const plotH = H - top - bottom;

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Results dimmed per period' });
  daily.forEach((d, i) => {
    const h = d.value > 0 ? Math.max(3, (d.value / max) * plotH) : 0;
    const x = i * slot + (slot - barW) / 2;
    const y = top + plotH - h;
    if (h > 0) svg.appendChild(svgEl('rect', { x, y, width: barW, height: h, rx: 4, class: 'bar' }));
    svg.appendChild(svgEl('text', { x: x + barW / 2, y: y - 6, 'text-anchor': 'middle', class: 'bar-value' }, d.value));
    svg.appendChild(svgEl('text', { x: x + barW / 2, y: H - 8, 'text-anchor': 'middle', class: 'bar-label' }, d.label));
  });
  return svg;
}

function render(): void {
  const content = document.getElementById('content')!;
  content.replaceChildren();

  document.querySelectorAll<HTMLButtonElement>('.segmented button').forEach((b) => {
    const on = b.dataset.range === range;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });

  if (!stats) {
    content.appendChild(el('p', 'empty', 'Nothing flagged yet.'));
    return;
  }
  const s = summarize(stats, range);
  const { totals } = s;
  if (!totals.dimmed && !totals.pagesFlagged && !totals.pagesHigh && !totals.paragraphs) {
    content.appendChild(el('p', 'empty', 'Nothing flagged yet.'));
    return;
  }

  // Totals. TODO(hack): images tile left out until image checks exist.
  const tiles = el('section', 'tiles');
  tiles.append(
    tile(totals.dimmed, 'search results dimmed', true),
    tile(totals.pagesHigh, 'pages rated high'),
    tile(totals.paragraphs, 'paragraphs outlined'),
  );
  content.appendChild(tiles);

  const grid = el('div', 'grid');

  const chartCard = el('section', 'card');
  chartCard.appendChild(el('h2', undefined, range === 'week' ? 'Results dimmed each day' : 'Results dimmed each week'));
  chartCard.appendChild(barChart(s.daily));
  grid.appendChild(chartCard);

  const sitesCard = el('section', 'card');
  sitesCard.appendChild(el('h2', undefined, 'Sites flagged most'));
  if (s.topDomains.length) {
    const ul = el('ul', 'sites');
    for (const d of s.topDomains.slice(0, 4)) {
      const li = el('li', 'site');
      const text = el('div', 'site-text');
      text.append(el('div', 'site-domain', d.domain), el('div', 'site-reason', reasonLabel(d.reason)));
      li.append(text, el('div', 'site-count', d.count));
      ul.appendChild(li);
    }
    sitesCard.appendChild(ul);
  } else {
    sitesCard.appendChild(el('p', 'muted', 'No sites flagged in this range.'));
  }
  grid.appendChild(sitesCard);
  content.appendChild(grid);

  const reasons = s.reasons.filter((r) => r.count > 0);
  if (reasons.length) {
    const whyCard = el('section', 'card');
    whyCard.appendChild(el('h2', undefined, 'Why results were dimmed'));
    const max = Math.max(...reasons.map((r) => r.count));
    const list = el('div', 'why');
    for (const r of reasons) {
      const row = el('div', 'why-row');
      const track = el('div', 'why-track');
      const fill = el('div', 'why-fill');
      fill.style.width = `${(r.count / max) * 100}%`;
      track.appendChild(fill);
      row.append(el('div', 'why-label', reasonLabel(r.templateId)), track, el('div', 'why-count', r.count));
      list.appendChild(row);
    }
    whyCard.appendChild(list);
    content.appendChild(whyCard);
  }
}

async function load(): Promise<void> {
  try {
    stats = ((await chrome.runtime.sendMessage({ type: 'stats/get' })) as Stats | undefined) ?? null;
  } catch {
    stats = null;
  }
  render();
}

document.querySelectorAll<HTMLButtonElement>('.segmented button').forEach((b) => {
  b.addEventListener('click', () => {
    range = b.dataset.range as Range;
    render();
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.stats) void load();
});

void load();
