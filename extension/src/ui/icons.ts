// Stroke-only SVG icons (no emoji). Use currentColor so callers set the stroke color via CSS.

const svg = (size: number, body: string, strokeWidth = 2): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

/** Open eye outline: the Unslop logo mark. */
export const eyeIcon = (size = 18): string =>
  svg(size, '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');

/** Logo: white stroke eye on an ink rounded square. */
export const logoTile = (size = 28): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true" focusable="false">` +
  `<rect width="28" height="28" rx="7" fill="#18181B"/>` +
  `<g transform="translate(6 6) scale(0.6667)" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></g></svg>`;

/** Right-pointing chevron. */
export const chevronIcon = (size = 16): string => svg(size, '<path d="M9 6l6 6-6 6"/>');

/** Close (X). */
export const closeIcon = (size = 16): string => svg(size, '<path d="M6 6l12 12M18 6L6 18"/>');
