import { describe, expect, it } from 'vitest';
import { bingTarget, urlFromDisplay, yahooTarget } from '../src/content/engines/bing';
import { queryOf, searchEngineOf } from '../src/content/urlmap';

describe('search engine detection', () => {
  it('recognises Google, Bing and Yahoo results pages', () => {
    expect(searchEngineOf('https://www.google.com/search?q=x')).toBe('google');
    expect(searchEngineOf('https://www.bing.com/search?q=x')).toBe('bing');
    expect(searchEngineOf('https://search.yahoo.com/search?p=x')).toBe('yahoo');
    expect(searchEngineOf('https://www.yahoo.com/')).toBeNull();
    expect(searchEngineOf('https://example.com/search?q=x')).toBeNull();
  });
  it('reads Yahoo queries from p', () => {
    expect(queryOf('https://search.yahoo.com/search?p=best+air+fryer')).toBe('best air fryer');
  });
});

describe('result URL decoding', () => {
  it('decodes Bing ck/a links', () => {
    const enc = 'a1' + btoa('https://windowsforum.com/threads/x').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(bingTarget(`https://www.bing.com/ck/a?!&&p=abc&u=${enc}&ntb=1`)).toBe('https://windowsforum.com/threads/x');
    expect(bingTarget('https://example.org/page')).toBe('https://example.org/page');
  });
  it('decodes Yahoo RU redirects', () => {
    const href = 'https://r.search.yahoo.com/_ylt=abc/RV=2/RE=1/RO=10/RU=' + encodeURIComponent('https://windowsforum.com/t/1') + '/RK=2/RS=xyz-';
    expect(yahooTarget(href)).toBe('https://windowsforum.com/t/1');
    expect(yahooTarget('https://search.yahoo.com/search?p=x')).toBeNull();
  });
  it('falls back to the displayed URL', () => {
    expect(urlFromDisplay('https://www.site.com › a › b')).toBe('https://www.site.com/');
    expect(urlFromDisplay('site.co.uk/path')).toBe('https://site.co.uk/');
    expect(urlFromDisplay('YouTube · Some Channel')).toBeNull();
  });
});
