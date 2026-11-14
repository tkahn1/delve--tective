// Speed spike: times layer B (WASM, then WebGPU if present) on 6 review-style chunks,
// and layer A on a ~2000-word article. Open as chrome-extension://<id>/bench/bench.html.
import { scoreLayerA } from '../src/checks/text/scorers/phrases';
import { createRobertaScorer } from '../src/checks/text/scorers/roberta';

const SAMPLES: string[] = [
  "In today's fast-paced world, finding the perfect coffee grinder can feel overwhelming. Whether you're a seasoned barista or a casual drinker, the right grinder will elevate your morning routine. This versatile machine boasts 40 grind settings, a sleek stainless steel design, and a user-friendly interface. Additionally, its burrs deliver consistent results every time. Overall, it is a game-changer for anyone who takes coffee seriously.",
  "Bought this grinder after my old blade one died. It's loud, honestly louder than I expected, and the static means grounds stick to the chute so I tap it a few times. But the grind is way more even and my pour-overs stopped tasting bitter. Took me a week to find the right setting for my Chemex (I'm on 18). Would buy again, wish the hopper was bigger.",
  "When it comes to air fryers, this model stands out from the competition. Its sleek design seamlessly fits into any kitchen, while the intuitive controls make cooking effortless. Moreover, the large capacity basket is perfect for families. Furthermore, cleanup is a breeze thanks to the dishwasher-safe parts. In conclusion, this air fryer is a must-have for anyone looking to unlock healthier meals.",
  "We've had it about four months. Fries are good, not as good as the deep fryer but close enough that the kids don't complain. The basket coating started flaking near the handle around month three, which is annoying for the price. Customer service sent a replacement basket without much fuss though. Biggest win is reheating pizza, it beats the microwave by a mile.",
  "Let's dive in to what makes this product truly exceptional. With cutting-edge technology and a comprehensive set of features, it offers a seamless experience from start to finish. It is important to note that the device is tailored to meet the needs of both beginners and experts. Ultimately, this is a top-notch choice that delivers peace of mind and outstanding value.",
  "My wife picked this up on sale. The app is pointless and wanted my email before it would do anything, so we just use the buttons. Preheat is fast. The timer beep is quiet enough that I miss it from the living room. Chicken thighs at 380 for 22 minutes came out great. Not sure it's worth full price but at sixty bucks no regrets.",
];

const out = document.getElementById('out')!;
const log = document.getElementById('log')!;
const say = (s: string) => (log.textContent += s + '\n');

function table(title: string, head: string[], rows: (string | number)[][]): void {
  const h = document.createElement('h2');
  h.textContent = title;
  h.style.fontSize = '16px';
  const t = document.createElement('table');
  t.innerHTML =
    '<tr>' + head.map((x) => `<th>${x}</th>`).join('') + '</tr>' +
    rows
      .map((r) => '<tr>' + r.map((c) => `<td class="${typeof c === 'number' ? 'num' : ''}">${c}</td>`).join('') + '</tr>')
      .join('');
  out.append(h, t);
}

function article(words: number): string {
  const base = SAMPLES.join(' ').split(/\s+/);
  const w: string[] = [];
  while (w.length < words) w.push(...base);
  return w.slice(0, words).join(' ');
}

async function benchLayerA(): Promise<void> {
  const text = article(2000);
  const paras = text.match(/(?:\S+\s+){0,149}\S+/g) ?? [text]; // ~150-word chunks
  scoreLayerA(text); // warm regex JIT
  const runs = 20;
  let t0 = performance.now();
  for (let i = 0; i < runs; i++) scoreLayerA(text);
  const whole = (performance.now() - t0) / runs;
  t0 = performance.now();
  for (let i = 0; i < runs; i++) paras.forEach(scoreLayerA);
  const chunked = (performance.now() - t0) / runs;
  table('Layer A (budget < 30 ms)', ['Input', 'ms (avg of 20)'], [
    ['2000 words, one string', whole.toFixed(2)],
    [`2000 words, ${paras.length} chunks`, chunked.toFixed(2)],
  ]);
  table('Layer A scores on samples', ['#', 'Layer A'], SAMPLES.map((s, i) => [i + 1, scoreLayerA(s).toFixed(3)]));
}

async function benchLayerB(device: string): Promise<void> {
  say(`Loading layer B on ${device}...`);
  const scorer = createRobertaScorer({ device });
  const t0 = performance.now();
  await scorer.init();
  const load = performance.now() - t0;
  if (!scorer.available) {
    say(`  ${device}: unavailable (${scorer.lastError})`);
    table(`Layer B on ${device}`, ['Status'], [[`unavailable: ${scorer.lastError}`]]);
    return;
  }
  await scorer.score([SAMPLES[0]]); // warmup run
  const rows: (string | number)[][] = [];
  let total = 0;
  for (let i = 0; i < SAMPLES.length; i++) {
    const s = performance.now();
    const [p] = await scorer.score([SAMPLES[i]]);
    const ms = performance.now() - s;
    total += ms;
    rows.push([i + 1, p.toFixed(4), ms.toFixed(1)]);
  }
  rows.push(['total (6 chunks)', '', total.toFixed(1)]);
  table(`Layer B on ${device} (load ${load.toFixed(0)} ms, labels: ${scorer.seenLabels.join(', ')})`, ['#', 'AI prob', 'ms'], rows);
}

(async () => {
  await benchLayerA();
  await benchLayerB('wasm');
  if ('gpu' in navigator && (await (navigator as any).gpu?.requestAdapter?.())) {
    await benchLayerB('webgpu');
  } else {
    say('WebGPU not available; skipped.');
  }
  say('Done.');
})().catch((e) => say('Bench failed: ' + (e instanceof Error ? e.stack : String(e))));
