import { describe, expect, it } from 'vitest';
import { matchStockPhrases } from '../src/content/stockPhrases';

const phrases = (t: string) => matchStockPhrases(t).map((m) => m.phrase);

describe('stock phrase underlines', () => {
  it('finds measured words and their inflections', () => {
    expect(phrases('This study delves into it and underscores the point, showcasing a meticulously built model.')).toEqual([
      'delves', 'underscores', 'showcasing', 'meticulously',
    ]);
  });

  it('finds documented multi-word patterns, any spacing or apostrophe style', () => {
    expect(phrases('The bridge stands as a  testament to design and plays a pivotal role in the city.')).toEqual([
      'stands as a testament', 'plays a pivotal role',
    ]);
    expect(phrases('A rich tapestry of flavors.')).toEqual(['a rich tapestry']);
  });

  it('only matches whole words', () => {
    expect(phrases('Fosters care, intricate aside, garnered praise.')).toEqual(['intricate', 'garnered']);
    expect(phrases('undelved, preshowcase, interplays')).toEqual([]);
  });

  it('does not underline marketing cliches or common words we excluded on purpose', () => {
    expect(phrases("In today's fast-paced world this game-changer is seamless, key and crucial.")).toEqual([]);
  });

  it('reports exact character spans', () => {
    const t = 'We delve deeper.';
    const [m] = matchStockPhrases(t);
    expect(t.slice(m.start, m.end)).toBe('delve');
  });
});
