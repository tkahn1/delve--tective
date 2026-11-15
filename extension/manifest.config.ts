import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

const icons = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
};

export default defineManifest({
  manifest_version: 3,
  name: 'delve—tective',
  description: 'Flags AI-generated junk in search results and on web pages.',
  version: pkg.version,
  icons,
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'delve—tective',
    default_icon: icons,
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>', 'file:///*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  permissions: ['storage', 'offscreen', 'tabs', 'activeTab', 'contextMenus'],
  options_page: 'src/options/index.html',
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
  },
  web_accessible_resources: [
    {
      resources: ['fonts/*.woff2', 'icons/*.png'],
      matches: ['<all_urls>'],
    },
  ],
});
