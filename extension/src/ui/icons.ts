// Stroke-only SVG icons (no emoji). Use currentColor so callers set the stroke color via CSS.

const svg = (size: number, body: string, strokeWidth = 2): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

/** Open eye outline: the Unslop logo mark. */
export const eyeIcon = (size = 18): string =>
  svg(size, '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');

/** Original hat-and-pipe profile mark. */
export const logoTile = (size = 28): string =>
  `<svg width="${size}" height="${size}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F3EADB"/><g fill="#493628"><path d="M17 23c0-9 5-15 14-15 8 0 13 5 14 14l-12-3-16 4Z"/><path d="m11 24 20-5 18 4 5 5H11Z"/><path d="M21 28h22l-1 6 6 6-6 2v7l-9 2-1 5H16l8-12-4-7Z"/><path d="m15 51 15-4 10 11H10Z"/></g><path d="M42 43h9c5 0 7-4 7-8" fill="none" stroke="#493628" stroke-width="3" stroke-linecap="round"/><path d="M54 31h8v6c0 5-8 5-8 0Z" fill="#493628"/><path d="m31 10-2 10" stroke="#BDA58A" stroke-width="1.5"/></svg>`;

/** Right-pointing chevron. */
export const chevronIcon = (size = 16): string => svg(size, '<path d="M9 6l6 6-6 6"/>');

/** Close (X). */
export const closeIcon = (size = 16): string => svg(size, '<path d="M6 6l12 12M18 6L6 18"/>');
