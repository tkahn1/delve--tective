import type { Check, Evidence, PageInput } from '../types';
import { isAllowlisted, registrableDomain } from '../../util/domain';
import { matchBuilder } from './builders';
import sitesData from '../../data/sites.json';

const SITES = sitesData as Record<string, 'farm' | 'builder'>;

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

    const kind = SITES[domain];
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
