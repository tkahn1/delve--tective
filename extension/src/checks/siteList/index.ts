import type { Check, Evidence, PageInput } from '../types';
import { isAllowlisted, registrableDomain } from '../../util/domain';
import { matchBuilder } from './builders';
import bloomData from '../../data/sites_bloom.json';
import { loadBloom, type BloomFilter } from '../../util/bloom';


// The list ships as Bloom filters (one per reason): compact, and scales to millions of domains.
// False-positive rate ~1e-5 per lookup (pipeline/bloom.py); the allowlist is checked first.
const filters = (bloomData as { filters: Record<'farm' | 'builder', BloomFilter | null> }).filters;
const isFarm = filters.farm ? loadBloom(filters.farm) : () => false;
const isBuilder = filters.builder ? loadBloom(filters.builder) : () => false;
function lookup(domain: string): 'farm' | 'builder' | undefined {
  if (isFarm(domain)) return 'farm';
  if (isBuilder(domain)) return 'builder';
  return undefined;
}

export const siteListCheck: Check = {
  id: 'siteList',
  targets: ['result', 'page'],
  runsIn: 'worker',
  async run(input: PageInput): Promise<Evidence | null> {
    let domain = input.domain;
    if (!domain) {
      try { domain = registrableDomain(new URL(input.url).hostname); } catch { return null; }
    }
    if (isAllowlisted(domain)) return null;

    const kind = lookup(domain);
    if (kind) {
      return {
        checkId: 'siteList',
        score: 1,
        confidence: 'high',
        reasons: [{ templateId: kind === 'builder' ? 'siteList.builder' : 'siteList.listed' }],
      };
    }

    if (input.target === 'page' && matchBuilder(input.clues)) {
      return { checkId: 'siteList', score: 0.8, confidence: 'medium', reasons: [{ templateId: 'siteList.builder' }] };
    }
    return null;
  },
};
