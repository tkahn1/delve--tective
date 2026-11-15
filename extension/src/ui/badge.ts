// Corner badge on opened pages: "Second look: {Level}", 5-segment meter, one summary line.
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
  const title = h('h2', {});
  const close = h('button', { class: 'x', type: 'button', 'aria-label': 'Close', html: closeIcon(14) });
  const segs = Array.from({ length: 5 }, () => h('span', { class: 'seg' }));
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, ...segs);
  const sum = h('p', { class: 'sum' });
  const all = h('button', { class: 'all', type: 'button' }, 'See all reasons');
  const setup = h('p', { class: 'setup' }, 'Setting up page checks…');
  const card = h('div', { class: 'u badge', role: 'status', hidden: '' }, h('div', { class: 'head' }, title, close), meter, sum, all, setup);
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
      title.textContent = hasLevel ? `Second look: ${capitalize(v.level as string)}` : 'delve—tective';
      title.parentElement!.hidden = false;
      meter.hidden = !hasLevel;
      segs.forEach((s, i) => s.classList.toggle('on', i < v.segments));
      sum.hidden = !hasLevel || !v.summary;
      sum.textContent = v.summary;
      all.hidden = !hasLevel;
      setup.hidden = !v.settingUp;
      card.hidden = false;
    },
    remove: sh.remove,
  };
}
