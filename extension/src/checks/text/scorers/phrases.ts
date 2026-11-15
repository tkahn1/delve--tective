// Layer A: cheap stock-phrase density + style signals. Loose filter, not a judge.
// Matching rules are documented in ../phrases.json (_doc) and must stay identical
// to the Python eval.
import lists from '../phrases.json';
import type { TextScorer } from './types';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Longest first so overlapping entries ("unlock the" vs "unlock") count once.
const byLength = (a: string, b: string) => b.length - a.length;
const PHRASE_RE = new RegExp(
  `(?<![a-z0-9])(?:${[...lists.phrases].sort(byLength).map(esc).join('|')})`,
  'g',
);
const TRANSITION_RE = new RegExp(
  `^(?:${[...lists.transitions].sort(byLength).map(esc).join('|')})(?![a-z0-9])`,
);

export interface LayerAFeatures {
  words: number;
  phraseHits: number;
  /** phrase hits per 100 words */
  phraseDensity: number;
  /** share of sentences that open with a transition word */
  transitionRate: number;
  /** coefficient of variation of sentence length in words (NaN-safe: 0 when < 3 sentences) */
  sentenceCv: number;
  sentences: number;
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"');
}

export function countWords(text: string): number {
  const m = text.match(/\S+/g);
  return m ? m.length : 0;
}

export function layerAFeatures(text: string): LayerAFeatures {
  const t = normalize(text);
  const words = countWords(t);
  const phraseHits = (t.match(PHRASE_RE) || []).length;

  const sentences = t
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^[^a-z0-9]+/, ''))
    .filter((s) => s.length > 0);
  let transitions = 0;
  const lens: number[] = [];
  for (const s of sentences) {
    if (TRANSITION_RE.test(s)) transitions++;
    lens.push(countWords(s));
  }
  let sentenceCv = 0;
  if (lens.length >= 3) {
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const variance = lens.reduce((a, b) => a + (b - mean) * (b - mean), 0) / lens.length;
    sentenceCv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  }
  return {
    words,
    phraseHits,
    phraseDensity: words > 0 ? (phraseHits * 100) / words : 0,
    transitionRate: sentences.length > 0 ? transitions / sentences.length : 0,
    sentenceCv,
    sentences: lens.length,
  };
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// TODO(hack): weights hand-tuned; refit against the Python eval so ~20-30% of
// human chunks clear config.text.layerA.passThreshold (currently 0: layer A only ranks chunks).
export function scoreFromFeatures(f: LayerAFeatures): number {
  const phrase = clamp01(f.phraseDensity / 2); // 2 hits per 100 words saturates
  const transition = clamp01(f.transitionRate / 0.25);
  // Uniform sentence lengths (low CV) look machine-made; humans usually sit at 0.5+.
  const uniform = f.sentences >= 3 ? clamp01((0.55 - f.sentenceCv) / 0.35) : 0;
  return clamp01(0.6 * phrase + 0.2 * transition + 0.2 * uniform);
}

export function scoreLayerA(text: string): number {
  return scoreFromFeatures(layerAFeatures(text));
}

export const phrasesScorer: TextScorer = {
  id: 'phrases',
  async score(chunks: string[]): Promise<number[]> {
    return chunks.map(scoreLayerA);
  },
};
