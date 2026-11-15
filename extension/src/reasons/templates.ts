// A fixed sentence per templateId. Checks never write free text, so reasons can't be invented.
// New wording needs Toby's approval.
import type { ReasonRef, TemplateId } from '../checks/types';

export const TEMPLATES: Record<TemplateId, string> = {
  'siteList.listed': 'on the shared junk-site list',
  'siteList.user': 'you marked this site',
  'siteList.builder': 'site built with an AI site builder',
  'copy.sameArticle': 'same article appears on {n} other sites',
  'copy.sameTitle': 'same title as {n} other results on this page',
  'text.page': '{k} of {n} paragraphs flagged by the text check',
  'text.chunk': 'Flagged by the text check',
};

/** Short labels for tight spaces (the paragraph hover box). Same facts, fewer words. */
export const SHORT_TEMPLATES: Record<TemplateId, string> = {
  'siteList.listed': 'Junk-site list',
  'siteList.user': 'You marked this site',
  'siteList.builder': 'AI site builder',
  'copy.sameArticle': 'Copied on {n} other sites',
  'copy.sameTitle': 'Same title as {n} other results',
  'text.page': '{k} of {n} paragraphs flagged',
  'text.chunk': 'Text check',
};

export function fillReason(ref: ReasonRef): string {
  return fillTemplate(TEMPLATES[ref.templateId], ref);
}

export function shortReason(ref: ReasonRef): string {
  return fillTemplate(SHORT_TEMPLATES[ref.templateId], ref);
}

function fillTemplate(template: string | undefined, ref: ReasonRef): string {
  if (!template) return '';
  // "{n} other sites" -> "1 other site" when n === 1 (also "results", "paragraphs").
  const plural = template.replace(/\{(\w+)\}( of \{\w+\})?( other)? (sites|results|paragraphs)\b/g, (m, key: string, of, other, noun: string) => {
    const countKey = of ? of.slice(5, -1) : key;
    return ref.values?.[countKey] === 1 ? m.slice(0, -1) : m;
  });
  return plural.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = ref.values?.[key];
    return v === undefined || v === null ? match : String(v);
  });
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
