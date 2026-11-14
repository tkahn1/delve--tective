import type { Check, Evidence, PageInput, ReasonRef } from '../types';
import { config } from '../../config/detectors.config';
import { isAllowlisted, normalizeUrl } from '../../util/domain';
import { signature, bandKeys } from './minhash';
import { sameTitleMatch } from './titles';
import copiesData from '../../data/copies.json';
import copyUrlsData from '../../data/copy_urls.json';

const COPIES = copiesData as Record<string, number>;
const COPY_URLS = copyUrlsData as Record<string, number>;

function urlLookup(url: string): number {
  return COPY_URLS[normalizeUrl(url)] ?? 0;
}

function evidence(score: number, confidence: Evidence['confidence'], reasons: ReasonRef[]): Evidence {
  return { checkId: 'copy', score, confidence, reasons };
}

export const copyCheck: Check = {
  id: 'copy',
  targets: ['result', 'page'],
  runsIn: 'worker',
  async run(input: PageInput): Promise<Evidence | null> {
    if (isAllowlisted(input.domain)) return null;
    const c = config.copy;

    if (input.target === 'page') {
      let maxCluster = 0;
      if (input.chunks && input.chunks.length) {
        const sig = signature(input.chunks.join(' '));
        if (sig) {
          for (const k of bandKeys(sig)) {
            const size = COPIES[k];
            if (size && size > maxCluster) maxCluster = size;
          }
        }
      }
      if (maxCluster > 1) {
        return evidence(c.articleScore, 'high', [{ templateId: 'copy.sameArticle', values: { n: maxCluster - 1 } }]);
      }
      const size = urlLookup(input.url);
      if (size > 1) return evidence(c.urlScore, 'high', [{ templateId: 'copy.sameArticle', values: { n: size - 1 } }]);
      return null;
    }

    // Search result.
    const size = urlLookup(input.url);
    if (size > 1) return evidence(c.urlScore, 'high', [{ templateId: 'copy.sameArticle', values: { n: size - 1 } }]);

    if (input.siblings && input.siblings.length) {
      const m = sameTitleMatch({ title: input.title, domain: input.domain }, input.siblings, input.query, {
        minLeftoverWords: c.minLeftoverWords,
        minTitleDomains: c.minTitleDomains,
        isAllowlisted,
      });
      if (m) return evidence(c.titleScore, 'medium', [{ templateId: 'copy.sameTitle', values: { n: m.n } }]);
    }
    return null;
  },
};
