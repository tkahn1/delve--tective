// Offscreen document: runs the heavy ('engine') checks off the service worker.
// Protocol per CONTRACT.md: SW -> {target:'engine', type:'engine/run'|'engine/warmup'};
// engine -> {target:'worker', type:'engine/status'|'engine/partial'|'engine/done'}.
import { checks } from '../checks/registry';
import { getLayerBStatus } from '../checks/text';
import type { Evidence, PageInput } from '../checks/types';

type EngineMsg =
  | { target: 'engine'; type: 'engine/run'; reqId: string | number; input: PageInput }
  | { target: 'engine'; type: 'engine/warmup' };

const engineChecks = checks.filter((c) => c.runsIn === 'engine');

function send(msg: Record<string, unknown>): void {
  chrome.runtime.sendMessage({ target: 'worker', ...msg }).catch(() => {
    /* SW may be asleep / not listening; it will ask again. */
  });
}

let warmPromise: Promise<void> | null = null;

function warmup(): Promise<void> {
  if (!warmPromise) {
    send({ type: 'engine/status', status: 'loading' });
    warmPromise = Promise.all(
      engineChecks.map((c) =>
        c.init ? c.init().catch((err) => console.warn('[unslop] init failed', c.id, err)) : undefined,
      ),
    ).then(() => undefined);
  }
  return warmPromise.then(() => {
    const s = getLayerBStatus();
    send({ type: 'engine/status', status: s === 'loading' ? 'ready' : s });
  });
}

async function run(reqId: string | number, input: PageInput): Promise<void> {
  const applicable = engineChecks.filter((c) => c.targets.includes(input.target));
  let last: Evidence | null = null;
  for (let i = 0; i < applicable.length; i++) {
    const check = applicable[i];
    let ev: Evidence | null = null;
    try {
      ev = await check.run(input, {
        onPartial: (evidence) => send({ type: 'engine/partial', reqId, evidence }),
      });
    } catch (err) {
      console.warn('[unslop] check failed', check.id, err);
    }
    // With several engine checks, earlier final results go out as partials;
    // done carries the last one. TODO(hack): only 'text' exists today.
    if (i < applicable.length - 1) {
      if (ev) send({ type: 'engine/partial', reqId, evidence: ev });
    } else {
      last = ev;
    }
  }
  send({ type: 'engine/done', reqId, evidence: last });
}

chrome.runtime.onMessage.addListener((msg: EngineMsg) => {
  if (!msg || msg.target !== 'engine') return false;
  if (msg.type === 'engine/warmup') {
    void warmup();
  } else if (msg.type === 'engine/run') {
    void run(msg.reqId, msg.input);
  }
  return false;
});

// The SW creates this document because it needs the engine; start loading right away.
void warmup();
