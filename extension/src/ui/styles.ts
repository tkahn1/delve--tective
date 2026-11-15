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
.bar b { font-weight: 600; }
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
.badge { position: fixed; right: 16px; bottom: 16px; width: 260px; background: #FFFFFF; color: ${C.ink};
  border: 1px solid ${C.border}; border-radius: 12px; padding: 12px 14px 12px;
  box-shadow: 0 6px 20px rgba(24,24,27,.12); pointer-events: auto; }
.badge[hidden] { display: none; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 8px; }
.head h2 { font-family: ${FONT_HEAD}; font-weight: 600; font-size: 13px; margin: 0; color: ${C.ink}; }
.x { color: ${C.secondary2}; width: 28px; height: 28px; margin: -6px -8px -6px 0; display: grid; place-items: center; border-radius: 6px; }
.x:hover { background: ${C.soft}; }
.meter { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 0 0 8px; }
.seg { height: 5px; border-radius: 3px; background: ${C.border}; }
.seg.on { background: ${C.flag}; }
.sum { font-size: 12px; color: ${C.secondary}; margin: 0 0 8px; }
.all { font-size: 12px; font-weight: 600; color: ${C.link}; text-decoration: underline; text-underline-offset: 2px; border-radius: 6px; }
.setup { font-size: 12px; color: ${C.secondary}; margin: 0; }
`;
