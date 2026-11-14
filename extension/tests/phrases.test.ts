import { describe, expect, it } from 'vitest';
import { layerAFeatures, scoreLayerA } from '../src/checks/text/scorers/phrases';

const SLOP =
  "In today's fast-paced world, finding the perfect coffee grinder can feel overwhelming. Whether you're a seasoned barista or a casual drinker, the right grinder will elevate your morning routine. This versatile machine boasts 40 grind settings, a sleek design, and a user-friendly interface. Additionally, its burrs deliver consistent results every time. Overall, it is a game-changer for anyone who takes coffee seriously.";

const HUMAN =
  "Bought this grinder after my old blade one died. It's loud, honestly louder than I expected, and the static means grounds stick to the chute so I tap it a few times. But the grind is way more even and my pour-overs stopped tasting bitter. Took me a week to find the right setting for my Chemex (I'm on 18). Would buy again, wish the hopper was bigger.";

const HUMAN2 =
  "We've had it about four months. Fries are good, not as good as the deep fryer but close enough that the kids don't complain. The basket coating started flaking near the handle around month three, which is annoying for the price. Customer service sent a replacement basket without much fuss though. Biggest win is reheating pizza, it beats the microwave by a mile.";

describe('layer A phrase scorer', () => {
  it('scores stock-phrase text high and passes the filter', () => {
    expect(scoreLayerA(SLOP)).toBeGreaterThanOrEqual(0.3);
  });

  it('scores plain human reviews below the pass threshold', () => {
    expect(scoreLayerA(HUMAN)).toBeLessThan(0.3);
    expect(scoreLayerA(HUMAN2)).toBeLessThan(0.3);
  });

  it('ranks slop above human text', () => {
    expect(scoreLayerA(SLOP)).toBeGreaterThan(scoreLayerA(HUMAN));
  });

  it('handles curly apostrophes and word boundaries', () => {
    const f = layerAFeatures('In today’s fast-paced world we test. Seamlessly done. Unseamless is not a hit.');
    expect(f.phraseHits).toBe(2); // "in today's fast-paced world" + "seamlessly"
  });

  it('counts transitions only at sentence start', () => {
    const f = layerAFeatures('Moreover, this works. It is overall fine. Furthermore, it is good. Plain sentence here.');
    expect(f.transitionRate).toBeCloseTo(2 / 4);
  });

  it('returns 0 for empty text and stays in range', () => {
    expect(scoreLayerA('')).toBe(0);
    const s = scoreLayerA(SLOP.repeat(10));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('runs under 30 ms on a ~2000-word article', () => {
    const words = (SLOP + ' ' + HUMAN).split(/\s+/);
    const text: string[] = [];
    while (text.length < 2000) text.push(...words);
    const article = text.slice(0, 2000).join(' ');
    scoreLayerA(article);
    const t0 = performance.now();
    scoreLayerA(article);
    expect(performance.now() - t0).toBeLessThan(30);
  });
});
