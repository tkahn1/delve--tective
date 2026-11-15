// Shared tokens + CSS for everything the content script injects (all inside shadow roots,
// except PAGE_CSS which restyles Google's own result elements).

export const C = {
  ink: '#29231f',
  secondary: '#4e443b',
  secondary2: '#63564b',
  dimmed: '#706358',
  border: '#ded5c8',
  soft: '#eee8de',
  flag: '#8c5c38',
  flagText: '#674329',
  flagTint: '#f3eadb',
  link: '#744e32',
} as const;

export const FONT_BODY = `'UnslopInter', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`;
export const FONT_HEAD = `'UnslopGrotesk', 'Space Grotesk', ${FONT_BODY}`;

/** Base reset applied in every shadow root. */
export const BASE_CSS = `
:host { all: initial; display: block; }
*, *::before, *::after { box-sizing: border-box; }
.u { font-family: ${FONT_BODY}; color: ${C.ink}; font-size: 13px; line-height: 1.4;
  -webkit-font-smoothing: antialiased; text-align: left; letter-spacing: normal; text-transform: none; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; }
button:focus-visible, a:focus-visible { outline: 2px solid ${C.link}; outline-offset: 2px; border-radius: 6px; }
svg { display: block; flex: none; }
[hidden] { display: none !important; }
`;

/** Injected into the page document (not a shadow root) to restyle Google's own result nodes. */
export const PAGE_CSS = `
[data-unslop-dim], [data-unslop-dim] * { color: ${C.dimmed} !important; }
/* Make dimmed results obvious at a glance: shaded box (shadow spread, so no layout shift)
   and faded thumbnails and favicons. The reason line stays full strength. */
[data-unslop-dim] { background: #F4F4F5 !important; box-shadow: 0 0 0 10px #F4F4F5 !important; border-radius: 6px !important; }
[data-unslop-dim] img, [data-unslop-dim] svg, [data-unslop-dim] video { opacity: 0.35 !important; filter: grayscale(1) !important; }
[data-unslop-dim] [data-unslop-ui] { color: initial !important; }
[data-unslop-hidden] { display: none !important; }
`;

export const SEARCH_CSS = `
.bar { display: flex; align-items: center; gap: 10px; background: ${C.flagTint}; color: ${C.flagText};
  border-radius: 10px; padding: 10px 14px; margin: 0 0 18px; max-width: 652px; font-size: 13px; }
.bar .ico { color: ${C.flag}; }
.bar .txt { flex: 1; min-width: 0; }
.toggle b { font-weight: 600; }
.bar .flip { color: ${C.flagText}; text-decoration: underline; text-underline-offset: 2px; font-weight: 500;
  min-height: 32px; padding: 0 4px; white-space: nowrap; border-radius: 6px; }
.reason { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; margin: 6px 0 2px;
  font-size: 12px; color: ${C.flagText}; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.flag}; flex: none; margin-right: 2px; }
.reason b { font-weight: 600; }
.show { color: ${C.ink}; text-decoration: underline; text-underline-offset: 2px; font-size: 12px;
  margin-left: 6px; border-radius: 6px; }
.hidden-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.secondary2};
  padding: 8px 0; margin: 0 0 16px; }
.hidden-line .show { margin-left: 0; font-size: 13px; color: ${C.link}; }
`;

export const OUTLINE_CSS = `
.layer { position: absolute; left: 0; top: 0; width: 0; height: 0; overflow: visible; pointer-events: none; }
.box { position: absolute; border: 2px dashed ${C.flag}; border-radius: 10px; pointer-events: none;
  background: transparent; transition: background-color 120ms ease; }
.box.on { background: ${C.flagTint}; }
`;

export const TOOLTIP_CSS = `
.tip { position: absolute; width: max-content; max-width: 200px; background: ${C.ink}; color: #FFFFFF; border-radius: 8px;
  padding: 8px 10px; box-shadow: 0 6px 16px rgba(0,0,0,.16); pointer-events: none; font-size: 12px; line-height: 1.4; }
.tip[hidden] { display: none; }
.tip .t { font-family: ${FONT_HEAD}; font-weight: 600; font-size: 12px; margin: 0 0 2px; color: #FFFFFF; }
.tip { pointer-events: auto; }
.tip .r { margin: 0 0 4px; color: #FFFFFF; }
.tip .lbl { cursor: help; border-bottom: 1px dotted rgba(255,255,255,.55); outline: none; border-radius: 2px; }
.tip .lbl:hover, .tip .lbl:focus-visible { border-bottom-color: #FFFFFF; background: rgba(255,255,255,.12); }
.tip .ex { margin: 0 0 6px; color: #E4E4E7; font-size: 11px; line-height: 1.35; }
.tip .ex[hidden] { display: none; }
.tip .fine { color: #A1A1AA; font-size: 10.5px; margin: 0; }
`;

export const BADGE_CSS = `
.badge { position: fixed; right: 16px; bottom: 16px; max-width: 340px; display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.96); color: ${C.secondary}; border: 1px solid ${C.border}; border-radius: 999px;
  padding: 5px 6px 5px 12px; font-size: 12px; line-height: 1.3; box-shadow: 0 2px 8px rgba(24,24,27,.08); pointer-events: auto; }
.badge[hidden] { display: none; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #D4A373; flex: none; }
.badge.high .dot { background: ${C.flag}; }
.t { font-weight: 600; color: ${C.ink}; flex: none; }
.sum { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.sum::before { content: '·'; margin-right: 6px; color: ${C.border}; }
.setup { color: ${C.secondary}; white-space: nowrap; }
.setup[hidden], .sum[hidden], .all[hidden] { display: none; }
.all { font-size: 12px; color: ${C.link}; text-decoration: underline; text-underline-offset: 2px; border-radius: 6px; flex: none; }
.x { color: ${C.secondary2}; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; flex: none; }
.x:hover { background: ${C.soft}; }
`;

/** Pill beside a YouTube comment's author line: "Repeated 15 times". Hover/focus shows COPY_TIP_CSS. */
export const COMMENT_FLAG_CSS = `
:host { display: inline-block; }
.flag { display: inline-flex; align-items: center; gap: 6px; background: ${C.flagTint}; color: ${C.flagText};
  border-radius: 999px; padding: 1px 9px 1px 8px; font-size: 11.5px; font-weight: 500; line-height: 18px;
  white-space: nowrap; cursor: help; }
.flag .dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.flag}; flex: none; }
.flag b { font-family: ${FONT_HEAD}; font-weight: 600; }
.show { margin-left: 8px; font-size: 11.5px; font-weight: 500; color: ${C.link}; text-decoration: underline;
  text-underline-offset: 2px; border-radius: 6px; }
.show[hidden] { display: none; }
`;

export const COPY_TIP_CSS = `
.tip { position: absolute; width: max-content; max-width: 240px; background: ${C.ink}; color: #FFFFFF; border-radius: 8px;
  padding: 8px 10px; box-shadow: 0 6px 16px rgba(0,0,0,.16); pointer-events: none; font-size: 12px; line-height: 1.4; }
.tip[hidden] { display: none; }
.tip .t { font-family: ${FONT_HEAD}; font-weight: 600; font-size: 12px; margin: 0 0 2px; color: #FFFFFF; }
.tip .r { margin: 0 0 6px; color: #FFFFFF; }
.tip .fine { color: #A1A1AA; font-size: 10.5px; margin: 0; }
`;

/** Summary at the top of a comment section: one slim line that expands to the top repeats on hover/focus/click. */
export const COPIES_SUMMARY_CSS = `
:host { display: block; }
.card { width: min(100%, 560px); margin: 0 0 14px; background: ${C.flagTint}; color: ${C.ink};
  border: 1px solid ${C.border}; border-radius: 8px; overflow: hidden;
  transition: box-shadow 160ms ease, border-color 160ms ease; }
.card.open, .card:hover, .card:focus-within { border-color: #d4c3ab; box-shadow: 0 4px 14px rgba(41,35,31,.08); }
.bar { display: flex; align-items: center; gap: 4px; padding: 3px 4px 3px 10px; min-height: 30px; }
.toggle { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; min-height: 24px;
  font-size: 12.5px; color: ${C.flagText}; text-align: left; }
.toggle .dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.flag}; flex: none; }
.toggle .line { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toggle b { font-family: ${FONT_HEAD}; font-weight: 600; }
.toggle .chev { color: ${C.secondary2}; transition: transform 200ms ease; }
.card.open .chev, .card:hover .chev, .card:focus-within .chev { transform: rotate(90deg); }
.x { color: ${C.secondary2}; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 6px; flex: none; }
.x:hover { background: ${C.soft}; }
/* Expands by animating the row height from 0fr to 1fr; collapses after a short delay so it doesn't flicker. */
.body { display: grid; grid-template-rows: 0fr; opacity: 0;
  transition: grid-template-rows 220ms ease 120ms, opacity 160ms ease 120ms; }
.card.open .body, .card:hover .body, .card:focus-within .body { grid-template-rows: 1fr; opacity: 1;
  transition: grid-template-rows 220ms ease, opacity 180ms ease 40ms; }
.inner { min-height: 0; overflow: hidden; padding: 0 12px; }
.list { list-style: none; margin: 0; padding: 0; }
.list li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 1px 10px; align-items: baseline;
  padding: 6px 0; border-top: 1px solid ${C.border}; }
.n { font-family: ${FONT_HEAD}; font-weight: 600; font-size: 13px; color: ${C.flagText}; min-width: 34px; }
.txt { font-size: 12.5px; color: ${C.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { grid-column: 2; font-size: 11px; color: ${C.dimmed}; }
.fine { font-size: 10.5px; color: ${C.dimmed}; margin: 2px 0 10px; }
@media (prefers-reduced-motion: reduce) { .card, .body, .toggle .chev { transition: none !important; } }
`;
