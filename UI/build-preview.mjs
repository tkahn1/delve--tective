import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(new URL('../extension/package.json', import.meta.url));
const { build } = require('esbuild');
await build({ entryPoints: [path.join(root, 'stats-adapter.ts')], outfile: path.join(root, 'assets/stats.js'), bundle: true, platform: 'browser', format: 'esm', target: 'es2022' });
console.log('Dashboard aggregation regenerated from extension/src/storage/stats.ts');
