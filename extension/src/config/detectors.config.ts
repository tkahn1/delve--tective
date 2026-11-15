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
  /** Comment copies: repeated comments across a whole YouTube video or Reddit thread (see CONTRACT.md). */
  commentCopies: {
    enabled: boolean;
    reddit: boolean; // also run on Reddit threads
    redditWorkers: number; // Reddit "load more" requests at once (Reddit rate-limits)
    maxComments: number; // top-level comments per video
    maxReplies: number;
    replyWorkers: number; // parallel reply threads, page requests
    apiWorkers: number; // parallel reply threads, official API
    liveRegroupMs: number; // regroup at most this often while scanning
    liveMaxDf: number; // word-frequency cap for quick passes while scanning (full pass at the end)
    minChars: number;
    nearThreshold: number;
    nearMinWords: number;
    campaignMin: number;
    minFlagCount: number; // flag a comment only when its group has at least this many comments
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
    // TODO(hack): layer A only ranks chunks (threshold 0); the top 20 go to layer B (~350 ms each
    // on WASM, ~7 s total, progressive). Tightened 2026-11-14 on 61 pre-2022 human pages + 16 live
    // 2026 content-farm pages: 0.9/top12/min2 outlined 10/61 human and caught 8/16 AI;
    // 0.98/top20/min3 outlined 1/61 human and caught 7/16 AI. Small set; see
    // reports/Browser AI text detectors.md (outside the repo) for next steps (probe on labels).
    maxChunks: 20,
    maxTokens: 256,
    minFlaggedChunks: 3,
    // Layer A = logistic regression (scorers/lr.ts, pipeline/lr/train.py). 0.25 = the trained
    // threshold where ~25% of held-out human chunks pass and ~95% of AI chunks pass
    // (eval/RESULTS_layerA_lr.md). Set to 0 to send every chunk to layer B again (ranking only).
    layerA: { passThreshold: 0.25 },
    layerB: {
      enabled: true,
      threshold: 0.98,
      modelId: 'fakespot-roberta',
      modelHost: '',
      device: 'wasm',
      dtype: 'q8',
      aiLabels: ['AI', 'LABEL_1', 'Fake'],
    },
  },
  // Measured 2026-11-15 on an 11,380-comment video: 39 s with page requests, 15 s with an API key.
  commentCopies: {
    enabled: true,
    reddit: true, // TODO(hack): not yet checked on live Reddit
    redditWorkers: 2,
    maxComments: 10000,
    maxReplies: 20000,
    replyWorkers: 8,
    apiWorkers: 8,
    liveRegroupMs: 700,
    liveMaxDf: 100,
    minChars: 12,
    nearThreshold: 0.6,
    nearMinWords: 5,
    campaignMin: 3,
    minFlagCount: 2,
  },
  // TODO(hack): dev-only map from saved demo pages to the real URLs they stand for.
  urlMap: {
    'google-coffee-grinder.html': 'https://www.google.com/search?q=best+coffee+grinder+2026',
    // Real archived pages from the same junk sites (demo/pages/archive/); these get outlines.
    'mayfairfarms-best-stanley-cups.html': 'https://www.mayfairfarms.com/best-stanley-cups/',
    'peggyomara-best-coffee-makers.html': 'https://www.peggyomara.com/best-coffee-makers/',
    'mayfairfarms.html': 'https://www.mayfairfarms.com/?p=73153',
    'peggyomara.html': 'https://www.peggyomara.com/best-coffee-grinders/',
    'google-air-fryer.html': 'https://www.google.com/search?q=best+air+fryer+2026',
    // Test fixture (extension/tests/fixtures/): live Google result blocks, /goto links.
    'google-live-2026-11-14.html': 'https://www.google.com/search?q=best+coffee+grinder+2026',
  },
};

export default config;
