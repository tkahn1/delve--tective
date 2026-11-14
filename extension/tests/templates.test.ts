import { describe, expect, it } from 'vitest';
import { TEMPLATES, capitalize, fillReason } from '../src/reasons/templates';

describe('reason templates', () => {
  it('fills placeholders', () => {
    expect(fillReason({ templateId: 'copy.sameArticle', values: { n: 4 } })).toBe(
      'same article appears on 4 other sites',
    );
    expect(fillReason({ templateId: 'copy.sameTitle', values: { n: 3 } })).toBe(
      'same title as 3 other results on this page',
    );
    expect(fillReason({ templateId: 'text.page', values: { k: 2, n: 6 } })).toBe(
      '2 of 6 paragraphs flagged by the text check',
    );
  });

  it('returns fixed text for templates without values', () => {
    expect(fillReason({ templateId: 'siteList.listed' })).toBe('on the shared junk-site list');
    expect(fillReason({ templateId: 'siteList.builder' })).toBe('site built with an AI site builder');
    expect(fillReason({ templateId: 'text.chunk' })).toBe('Flagged by the text check');
  });

  it('capitalizes', () => {
    expect(capitalize(fillReason({ templateId: 'siteList.listed' }))).toBe('On the shared junk-site list');
    expect(capitalize('')).toBe('');
  });

  it('never uses banned wording', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t.toLowerCase()).not.toMatch(/fake|ai-written/);
    }
  });
});
