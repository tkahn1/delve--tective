// A fixed sentence per templateId. Checks never write free text, so reasons can't be invented.
// New wording needs Toby's approval.
import type { ReasonRef, TemplateId } from '../checks/types';

export const TEMPLATES: Record<TemplateId, string> = {
  'siteList.listed': 'on the shared junk-site list',
  'siteList.builder': 'site built with an AI site builder',
  'copy.sameArticle': 'same article appears on {n} other sites',
  'copy.sameTitle': 'same title as {n} other results on this page',
  'text.page': '{k} of {n} paragraphs flagged by the text check',
  'text.chunk': 'Flagged by the text check',
};

export function fillReason(ref: ReasonRef): string {
  const template = TEMPLATES[ref.templateId];
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = ref.values?.[key];
    return v === undefined || v === null ? match : String(v);
  });
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
