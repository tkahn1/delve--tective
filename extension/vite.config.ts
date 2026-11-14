/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from './manifest.config';

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Copy a file only when the destination is missing or older (keeps rebuilds fast). */
function copyIfNewer(src: string, dest: string): void {
  if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) return;
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

/** Find the onnxruntime-web dist folder (nested under transformers or hoisted). */
function findOrtDist(): string | null {
  const candidates = [
    join(root, 'node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist'),
    join(root, 'node_modules/onnxruntime-web/dist'),
  ];
  try {
    candidates.push(dirname(require.resolve('onnxruntime-web/package.json', { paths: [root] })) + '/dist');
  } catch {
    /* not resolvable directly */
  }
  return candidates.find((p) => existsSync(p)) ?? null;
}

/**
 * Copies runtime assets into public/ (gitignored) so both `vite` (dev) and `vite build`
 * serve them at the extension root:
 *   public/ort/    onnxruntime-web WASM + loader .mjs (MV3 forbids remote code; set wasmPaths to chrome.runtime.getURL('ort/'))
 *   public/fonts/  Inter 400/500/600 + Space Grotesk 600/700 (latin), for chrome.runtime.getURL('fonts/...')
 */
function unslopAssets(): Plugin {
  const publicDir = join(root, 'public');
  const copyAll = () => {
    const ortDist = findOrtDist();
    if (ortDist) {
      for (const f of readdirSync(ortDist)) {
        if (/^ort-wasm.*\.(wasm|mjs)$/.test(f)) copyIfNewer(join(ortDist, f), join(publicDir, 'ort', f));
      }
    } else {
      console.warn('[unslop-assets] onnxruntime-web dist not found; ort/ not copied');
    }
    const fonts: [string, string][] = [
      ['@fontsource/inter/files/inter-latin-400-normal.woff2', 'inter-400.woff2'],
      ['@fontsource/inter/files/inter-latin-500-normal.woff2', 'inter-500.woff2'],
      ['@fontsource/inter/files/inter-latin-600-normal.woff2', 'inter-600.woff2'],
      ['@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2', 'space-grotesk-600.woff2'],
      ['@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2', 'space-grotesk-700.woff2'],
    ];
    for (const [src, name] of fonts) {
      const abs = join(root, 'node_modules', src);
      if (existsSync(abs)) copyIfNewer(abs, join(publicDir, 'fonts', name));
      else console.warn(`[unslop-assets] missing font ${src}`);
    }
  };
  return {
    name: 'unslop-assets',
    // Runs before Vite copies publicDir, in both serve and build.
    config() {
      copyAll();
    },
  };
}

export default defineConfig({
  plugins: [unslopAssets(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        offscreen: resolve(root, 'src/engine/offscreen.html'),
        report: resolve(root, 'src/report/index.html'),
        bench: resolve(root, 'bench/bench.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
