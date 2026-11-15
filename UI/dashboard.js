import { summarize } from './assets/stats.js';
import { sampleStats, previewDate } from './sample-data.js';

const label = {'siteList.listed':'On the shared junk-site list','siteList.builder':'Built with an AI site builder','copy.sameArticle':'Same article on other sites','copy.sameTitle':'Same title as other results','text.page':'Paragraphs flagged by the text check','text.chunk':'Flagged by the text check'};
const $ = selector => document.querySelector(selector);
const number = new Intl.NumberFormat('en-US');
const dateFormat = new Intl.DateTimeFormat('en-US', {month:'short',day:'numeric'});
let range = 'week';

function element(tag, className, text) {
 const node = document.createElement(tag);
 if (className) node.className = className;
 if (text !== undefined) node.textContent = text;
 return node;
}
function render() {
 const summary = summarize(sampleStats, range, previewDate);
 document.querySelectorAll('[data-range]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.range === range)));
 $('#total-dimmed').textContent = number.format(summary.totals.dimmed);
 $('#total-pages').textContent = number.format(summary.totals.pagesFlagged);
 $('#total-paragraphs').textContent = number.format(summary.totals.paragraphs);
 $('#date-range').textContent = range === 'week' ? 'Nov 9–15, 2026' : range === 'month' ? 'Oct 16–Nov 14, 2026' : 'All sample activity through Nov 14, 2026';
 $('#chart-title').textContent = range === 'week' ? 'Results dimmed each day' : 'Results dimmed each week';
 $('#chart-detail').textContent = 'Select a bar for its count';
 const chart = $('#activity-chart');
 chart.replaceChildren();
 chart.setAttribute('aria-label', range === 'week' ? 'Results dimmed by day' : 'Results dimmed by week');
 const max = Math.max(1, ...summary.daily.map(d => d.value));
 for (const point of summary.daily) {
  const col = element('div','bar-item');
  const button = element('button','bar-button');
  button.type = 'button';
  button.setAttribute('aria-label', `${point.label}: ${number.format(point.value)} results dimmed`);
  button.setAttribute('aria-pressed','false');
  const fill = element('span','bar-fill');
  fill.style.height = `${point.value ? Math.max(3, point.value / max * 122) : 0}px`;
  button.append(element('span','bar-value',number.format(point.value)),fill);
  button.addEventListener('click', () => {
   chart.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
   $('#chart-detail').textContent = `${point.label}: ${number.format(point.value)} results dimmed`;
  });
  col.append(button,element('span','bar-label',point.label));
  chart.append(col);
 }
 const sites = $('#sites');sites.replaceChildren();
 for (const item of summary.topDomains) {
  const tr = element('tr');const td = element('td');
  td.append(element('span','domain',item.domain),element('span','site-reason',label[item.reason] || item.reason));
  tr.append(td,element('td','numeric',number.format(item.count)));sites.append(tr);
 }
 const reasons = $('#reasons');reasons.replaceChildren();
 for (const item of summary.reasons) {
  const row = element('div','reason-row');
  row.append(element('span','',label[item.templateId] || item.templateId),element('span','reason-count',number.format(item.count)));
  reasons.append(row);
 }
}
document.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => {range = button.dataset.range;render();}));
render();
