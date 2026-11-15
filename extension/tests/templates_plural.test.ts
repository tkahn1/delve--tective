import { describe, expect, it } from 'vitest';
import { fillReason } from '../src/reasons/templates';
describe('pluralisation', () => {
  it('singular for 1', () => {
    expect(fillReason({ templateId: 'copy.sameArticle', values: { n: 1 } })).toBe('same article appears on 1 other site');
    expect(fillReason({ templateId: 'copy.sameTitle', values: { n: 1 } })).toBe('same title as 1 other result on this page');
    expect(fillReason({ templateId: 'text.page', values: { k: 1, n: 1 } })).toBe('1 of 1 paragraph flagged by the text check');
  });
  it('plural otherwise', () => {
    expect(fillReason({ templateId: 'copy.sameArticle', values: { n: 3 } })).toBe('same article appears on 3 other sites');
    expect(fillReason({ templateId: 'text.page', values: { k: 1, n: 4 } })).toBe('1 of 4 paragraphs flagged by the text check');
  });
});
