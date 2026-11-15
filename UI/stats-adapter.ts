// Use the extension's actual aggregation logic instead of a second dashboard implementation.
// Generate assets/stats.js with `node UI/build-preview.mjs` after installing extension dependencies.
export { summarize } from '../extension/src/storage/stats';
