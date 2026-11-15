// Search-results UI: summary bar above results, reason line under a flagged result,
// and the collapsed "{n} results hidden · Show" line for Hide mode.
import { eyeIcon } from './icons';
import { createShadowHost, h, type ShadowHost } from './shadow';
import { SEARCH_CSS } from './styles';

export type Mode = 'dim' | 'hide';

export interface SummaryBar {
  host: HTMLElement;
  update(n: number, total: number, mode: Mode): void;
  remove(): void;
}

export function createSummaryBar(onFlip: (next: Mode) => void): SummaryBar {
  const sh = createShadowHost(SEARCH_CSS);
  const txt = h('div', { class: 'txt' });
  const flip = h('button', { class: 'flip', type: 'button' });
  const bar = h('div', { class: 'u bar', role: 'status' }, h('span', { class: 'ico', html: eyeIcon(16) }), txt, flip);
  sh.root.appendChild(bar);
  let mode: Mode = 'dim';
  flip.addEventListener('click', (e) => {
    e.preventDefault();
    onFlip(mode === 'dim' ? 'hide' : 'dim');
  });
  return {
    host: sh.host,
    update(n, total, m) {
      mode = m;
      txt.textContent = '';
      // TODO(hack): plan only gives "dimmed" wording; "hid" in Hide mode is our guess.
      const verb = m === 'hide' ? 'hid' : 'dimmed';
      txt.append(h('b', {}, `delve—tective ${verb} ${n} of ${total} results.`));
      flip.textContent = m === 'dim' ? 'Hide them instead' : 'Dim them instead';
    },
    remove: sh.remove,
  };
}

/** "• Worth a second look: a · b   Show anyway" */
export function createReasonLine(reasons: string[], onShow: () => void): ShadowHost {
  const sh = createShadowHost(SEARCH_CSS);
  const show = h('button', { class: 'show', type: 'button' }, 'Show anyway');
  show.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onShow();
  });
  sh.root.appendChild(
    h('div', { class: 'u reason' },
      h('span', { class: 'dot', 'aria-hidden': 'true' }),
      h('span', {}, h('b', {}, 'Flagged:'), ' ', reasons.join(' · ')),
      show),
  );
  return sh;
}

export interface HiddenLine {
  host: HTMLElement;
  update(n: number): void;
  remove(): void;
}

/** "{n} results hidden · Show" */
export function createHiddenLine(onShow: () => void): HiddenLine {
  const sh = createShadowHost(SEARCH_CSS);
  const label = h('span', {});
  const show = h('button', { class: 'show', type: 'button' }, 'Show');
  show.addEventListener('click', (e) => {
    e.preventDefault();
    onShow();
  });
  sh.root.appendChild(h('div', { class: 'u hidden-line' }, label, h('span', { 'aria-hidden': 'true' }, '·'), show));
  return {
    host: sh.host,
    update(n) {
      label.textContent = `${n} result${n === 1 ? '' : 's'} hidden`;
    },
    remove: sh.remove,
  };
}
