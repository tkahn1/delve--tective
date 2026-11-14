// Registers the bundled fonts on the host document so Shadow DOM UI can use them.
// Font files are copied to fonts/ by vite.config.ts and listed in web_accessible_resources.
// @font-face rules inside a shadow root are ignored by Chrome, so we add FontFace objects to document.fonts.

export const FONT_BODY = 'UnslopInter';
export const FONT_HEADING = 'UnslopGrotesk';

/** CSS font-family stacks to use inside shadow roots. */
export const FONT_BODY_STACK = `'${FONT_BODY}', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
export const FONT_HEADING_STACK = `'${FONT_HEADING}', '${FONT_BODY}', system-ui, sans-serif`;

const FACES: { family: string; file: string; weight: string }[] = [
  { family: FONT_BODY, file: 'fonts/inter-400.woff2', weight: '400' },
  { family: FONT_BODY, file: 'fonts/inter-500.woff2', weight: '500' },
  { family: FONT_BODY, file: 'fonts/inter-600.woff2', weight: '600' },
  { family: FONT_HEADING, file: 'fonts/space-grotesk-600.woff2', weight: '600' },
  { family: FONT_HEADING, file: 'fonts/space-grotesk-700.woff2', weight: '700' },
];

let pending: Promise<void> | null = null;

/** Idempotent. Resolves once all faces have loaded (or failed; failures fall back to system fonts). */
export function ensureFonts(doc: Document = document): Promise<void> {
  if (pending) return pending;
  pending = (async () => {
    if (typeof FontFace === 'undefined' || !doc.fonts || typeof chrome === 'undefined' || !chrome.runtime?.getURL) {
      return;
    }
    await Promise.all(
      FACES.map(async ({ family, file, weight }) => {
        const url = chrome.runtime.getURL(file);
        const desc: FontFaceDescriptors = { weight, style: 'normal', display: 'swap' };
        try {
          // ArrayBuffer source sidesteps the page's font-src CSP.
          const buf = await fetch(url).then((r) => {
            if (!r.ok) throw new Error(String(r.status));
            return r.arrayBuffer();
          });
          const face = new FontFace(family, buf, desc);
          await face.load();
          doc.fonts.add(face);
          return;
        } catch {
          /* fall through to url() source */
        }
        try {
          const face = new FontFace(family, `url("${url}") format("woff2")`, desc);
          doc.fonts.add(face);
          await face.load();
        } catch {
          // Page CSP or missing file: system font fallback is fine.
        }
      }),
    );
  })();
  return pending;
}
