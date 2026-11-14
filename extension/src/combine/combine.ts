// Turns a list of Evidence into a level using the weights from the config.
import type { Evidence, Level, ReasonRef } from '../checks/types';
import { config } from '../config/detectors.config';

export interface Combined {
  score: number;
  level: Level | null;
  segments: number;
  reasons: ReasonRef[];
}

const LEVEL_RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };

export function levelAtLeast(level: Level | null | undefined, min: Level): boolean {
  if (!level) return false;
  return LEVEL_RANK[level] >= LEVEL_RANK[min];
}

export function weightFor(e: Evidence): number {
  if (e.checkId === 'text' && e.confidence === 'low' && !(e.spans && e.spans.length)) {
    return config.weights.textLayerAOnly;
  }
  return config.weights[e.checkId] ?? 0;
}

export function scoreToLevel(score: number): Level {
  if (score >= config.levels.high) return 'high';
  if (score >= config.levels.medium) return 'medium';
  return 'low';
}

export function segmentsFor(level: Level | null, score: number): number {
  switch (level) {
    case null:
      return 0;
    case 'low':
      return score < 0.2 ? 1 : 2;
    case 'medium':
      return 3;
    case 'high':
      return score < 0.85 ? 4 : 5;
  }
}

export function combine(evidence: Evidence[]): Combined {
  const contributing = evidence
    .filter((e) => e && e.score > 0)
    .map((e) => ({ e, weighted: weightFor(e) * e.score }));

  if (contributing.length === 0) {
    return { score: 0, level: null, segments: 0, reasons: [] };
  }

  const raw = contributing.reduce((sum, c) => sum + c.weighted, 0);
  const score = Math.max(0, Math.min(1, raw));
  const level = scoreToLevel(score);

  const reasons: ReasonRef[] = [];
  const seen = new Set<string>();
  for (const c of [...contributing].sort((a, b) => b.weighted - a.weighted)) {
    for (const r of c.e.reasons) {
      const key = r.templateId + JSON.stringify(r.values ?? {});
      if (seen.has(key)) continue;
      seen.add(key);
      reasons.push(r);
    }
  }

  return { score, level, segments: segmentsFor(level, score), reasons };
}
