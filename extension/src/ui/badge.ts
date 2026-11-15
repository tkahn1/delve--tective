// Corner badge on opened pages: a small, quiet pill. "● Flagged · <first reason> · Details ×".
import type { Level } from '../checks/types';
import { capitalize } from '../reasons/templates';
import { closeIcon } from './icons';
import { createShadowHost, h } from './shadow';
import { BADGE_CSS } from './styles';

export interface BadgeView {
  level: Level | null;
  segments: number;
  summary: string;
  settingUp: boolean;
}

export interface Badge {
  update(v: BadgeView | null): void;
  remove(): void;
}

export function createBadge(opts: { onSeeAll(): void; onClose(): void }): Badge {
  const sh = createShadowHost(BADGE_CSS, 'position:fixed;right:0;bottom:0;width:0;height:0;z-index:2147483647;');
  const dot = h('span', { class: 'dot', 'aria-hidden': 'true' });
  const title = h('span', { class: 't' });
  const sum = h('span', { class: 'sum' });
  const all = h('button', { class: 'all', type: 'button' }, 'Details');
  const setup = h('span', { class: 'setup' }, 'Loading text model…');
  const close = h('button', { class: 'x', type: 'button', 'aria-label': 'Close', html: closeIcon(12) });
  const card = h('div', { class: 'u badge', role: 'status', hidden: '' }, dot, title, sum, setup, all, close);
  sh.root.appendChild(card);
  document.documentElement.appendChild(sh.host);

  close.addEventListener('click', () => {
    card.hidden = true;
    opts.onClose();
  });
  all.addEventListener('click', () => opts.onSeeAll());

  return {
    update(v) {
      if (!v) {
        card.hidden = true;
        return;
      }
      const hasLevel = v.level === 'medium' || v.level === 'high';
      title.textContent = hasLevel ? 'Flagged' : 'delve—tective';
      card.classList.toggle('high', v.level === 'high');
      card.setAttribute('aria-label', hasLevel ? `Flagged (${capitalize(v.level as string)}). ${v.summary}` : 'delve—tective');
      // One short reason in the pill; the full summary is in the tooltip and behind Details.
      const first = (v.summary || '').split('. ')[0].replace(/\.$/, '');
      sum.hidden = !hasLevel || !first;
      sum.textContent = first;
      card.title = v.summary || '';
      all.hidden = !hasLevel;
      setup.hidden = !v.settingUp;
      card.hidden = false;
    },
    remove: sh.remove,
  };
}
