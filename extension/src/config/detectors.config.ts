// Settings for every check in one place. Tuning should never need a code change.
import type { Level } from '../checks/types';

export interface DetectorsConfig {
  weights: { siteList: number; copy: number; text: number; textLayerAOnly: number; [checkId: string]: number };
  levels: { medium: number; high: number };
  resultFlagLevel: Level;
  maxResultReasons: number;
  copy: {
    numHashes: number;
    shingle: number;
    bands: number;
    rows: number;
    urlScore: number;
    articleScore: number;
    titleScore: number;
    minTitleDomains: number;
    minLeftoverWords: number;
  };
  text: {
    minWords: number;
    chunkMin: number;
    chunkMax: number;
    maxChunks: number;
    maxTokens: number;
    minFlaggedChunks: number;
    layerA: { passThreshold: number };
    layerB: {
      enabled: boolean;
      threshold: number;
      modelId: string;
      modelHost: string; // '' => bundled at public/models/
      device: 'wasm' | 'webgpu';
      dtype: 'q8' | 'fp32' | 'fp16' | 'q4';
      aiLabels: string[];
    };
  };
  /** Keys are file basenames; applies only when page is file:// or localhost/127.0.0.1. */
  urlMap: Record<string, string>;
}

export const config: DetectorsConfig = {
  weights: { siteList: 0.7, copy: 0.6, text: 0.5, textLayerAOnly: 0.15 },
  levels: { medium: 0.4, high: 0.6 }, // score < medium => low
  resultFlagLevel: 'medium', // results at/above this are dimmed
  maxResultReasons: 2,
  copy: {
    numHashes: 128,
    shingle: 5,
    bands: 32,
    rows: 4,
    urlScore: 0.9,
    articleScore: 1,
    titleScore: 0.7,
    minTitleDomains: 3,
    minLeftoverWords: 2,
  },
  text: {
    minWords: 50,
    chunkMin: 80,
    chunkMax: 250,
    // TODO(hack): tuned on the live mayfairfarms/peggyomara pages (2026-11-14). At 0.3 layer A
    // passed only ~8% of real chunks and missed most model-flagged ones, so it now only ranks
    // chunks (threshold 0) and the top 12 go to layer B (~350 ms each on WASM, ~4 s total).
    maxChunks: 12,
    maxTokens: 256,
    minFlaggedChunks: 2,
    layerA: { passThreshold: 0 },
    layerB: {
      enabled: true,
      threshold: 0.9,
      modelId: 'fakespot-roberta',
      modelHost: '',
      device: 'wasm',
      dtype: 'q8',
      aiLabels: ['AI', 'LABEL_1', 'Fake'],
    },
  },
  // TODO(hack): dev-only map from saved demo pages to the real URLs they stand for.
  urlMap: {
    'google-coffee-grinder.html': 'https://www.google.com/search?q=best+coffee+grinder+2026',
    'mayfairfarms.html': 'https://www.mayfairfarms.com/?p=73153',
    'peggyomara.html': 'https://www.peggyomara.com/best-coffee-grinders/',
    'google-air-fryer.html': 'https://www.google.com/search?q=best+air+fryer+2026',
    // Test fixture (extension/tests/fixtures/): live Google result blocks, /goto links.
    'google-live-2026-11-14.html': 'https://www.google.com/search?q=best+coffee+grinder+2026',
  },
};

export default config;
