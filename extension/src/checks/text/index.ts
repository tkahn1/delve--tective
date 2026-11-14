// Text check: layer A (phrases) filters, layer B (RoBERTa) judges. Runs in the offscreen doc.
import { config } from '../../config/detectors.config';
import type { Check, CheckContext, Evidence, PageInput, SpanFlag } from '../types';
import { countWords, phrasesScorer } from './scorers/phrases';
import { robertaScorer } from './scorers/roberta';

export type LayerBStatus = 'loading' | 'ready' | 'unavailable';

let initPromise: Promise<void> | null = null;

export function getLayerBStatus(): LayerBStatus {
  if (!config.text.layerB.enabled) return 'unavailable';
  if (robertaScorer.available) return 'ready';
  if (robertaScorer.lastError) return 'unavailable';
  return 'loading';
}

function evidenceFor(flagged: SpanFlag[], eligible: number): Evidence {
  const k = flagged.length;
  // Outline rule: nothing on the page is reported unless enough chunks are flagged.
  // TODO(hack): below the rule we also report score 0 so a single stray chunk never nudges the level.
  if (k < config.text.minFlaggedChunks) {
    return { checkId: 'text', score: 0, confidence: 'medium', reasons: [], spans: [] };
  }
  return {
    checkId: 'text',
    score: eligible > 0 ? k / eligible : 0,
    confidence: 'medium',
    reasons: [{ templateId: 'text.page', values: { k, n: eligible } }],
    spans: [...flagged].sort((a, b) => a.chunkIndex - b.chunkIndex),
  };
}

export const textCheck: Check = {
  id: 'text',
  targets: ['page'],
  runsIn: 'engine',

  init() {
    if (!initPromise) initPromise = robertaScorer.init();
    return initPromise;
  },

  async run(input: PageInput, ctx?: CheckContext): Promise<Evidence | null> {
    const chunks = input.chunks ?? [];
    const eligible: number[] = [];
    chunks.forEach((c, i) => {
      if (countWords(c) >= config.text.minWords) eligible.push(i);
    });
    if (eligible.length === 0) return null;

    const aScores = await phrasesScorer.score(eligible.map((i) => chunks[i]));
    const passing = eligible
      .map((idx, j) => ({ idx, a: aScores[j] }))
      .filter((p) => p.a >= config.text.layerA.passThreshold);

    if (config.text.layerB.enabled) await textCheck.init!();
    if (!robertaScorer.available) {
      // Layer A only: no outlines, small nudge via textLayerAOnly weight in combine.
      return {
        checkId: 'text',
        score: passing.length / eligible.length,
        confidence: 'low',
        reasons: [],
      };
    }

    const toCheck = [...passing].sort((x, y) => y.a - x.a).slice(0, config.text.maxChunks);
    const flagged: SpanFlag[] = [];
    for (const p of toCheck) {
      let prob = 0;
      try {
        [prob] = await robertaScorer.score([chunks[p.idx]]);
      } catch (err) {
        console.warn('[unslop] layer B chunk failed:', err);
        continue;
      }
      if (prob >= config.text.layerB.threshold) {
        flagged.push({ chunkIndex: p.idx, score: prob, reasons: [{ templateId: 'text.chunk' }] });
      }
      ctx?.onPartial?.(evidenceFor(flagged, eligible.length));
    }
    return evidenceFor(flagged, eligible.length);
  },
};
