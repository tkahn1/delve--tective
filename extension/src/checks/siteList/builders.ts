import type { DomClues } from '../types';
import buildersData from '../../data/builders.json';

// TODO(hack): port the full SlopTotal fingerprint rules (https://github.com/pablocaeg/sloptotal, MIT).
const BUILDERS = buildersData as { generators: string[]; scriptHosts: string[] };
const GENERATORS = BUILDERS.generators.map((g) => g.toLowerCase());
const SCRIPT_HOSTS = BUILDERS.scriptHosts.map((h) => h.toLowerCase());

/** Returns the matched builder fingerprint, or null. */
export function matchBuilder(clues: DomClues | undefined): string | null {
  if (!clues) return null;
  for (const g of clues.generators ?? []) {
    const v = g.toLowerCase();
    const hit = GENERATORS.find((s) => v.includes(s));
    if (hit) return hit;
  }
  for (const h of clues.scriptHosts ?? []) {
    const v = h.toLowerCase();
    const hit = SCRIPT_HOSTS.find((s) => v === s || v.endsWith('.' + s) || v.includes(s));
    if (hit) return hit;
  }
  return null;
}
