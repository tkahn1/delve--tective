// Layer B: Fakespot RoBERTa through Transformers.js, run in the offscreen document.
// `@huggingface/transformers` is imported lazily inside init so the service worker
// bundle never loads it.
import { config } from '../../../config/detectors.config';
import type { TextScorer } from './types';

export interface RobertaOptions {
  modelId?: string;
  device?: string; // 'wasm' | 'webgpu'
  dtype?: string; // 'q8' => onnx/model_quantized.onnx
  maxTokens?: number;
  aiLabels?: readonly string[];
}

export interface RobertaScorer extends TextScorer {
  init(): Promise<void>;
  /** true once the model loaded; false when it failed or is disabled. */
  readonly available: boolean;
  readonly lastError: string | null;
  /** Labels the model reported on the last call (for the bench / debugging). */
  readonly seenLabels: string[];
}

// TODO(hack): verify the Fakespot model's id2label in public/models/fakespot-roberta/config.json.
// Assumed: index 1 is the AI class, named 'AI' or 'LABEL_1' (config.text.layerB.aiLabels).
// If no AI label is found we fall back to 1 - score(human-ish label).
const HUMAN_LABELS = ['human', 'label_0', 'real', 'original'];

type Classifier = ((text: string, opts?: Record<string, unknown>) => Promise<unknown>) & {
  tokenizer?: {
    encode(text: string, opts?: Record<string, unknown>): number[];
    decode(ids: number[], opts?: Record<string, unknown>): string;
  };
};

export function createRobertaScorer(opts: RobertaOptions = {}): RobertaScorer {
  const lb = config.text.layerB;
  const modelId = opts.modelId ?? lb.modelId;
  const device = opts.device ?? lb.device;
  const dtype = opts.dtype ?? lb.dtype;
  const maxTokens = opts.maxTokens ?? config.text.maxTokens;
  const aiLabels = (opts.aiLabels ?? lb.aiLabels).map((l) => String(l).toLowerCase());

  let classifier: Classifier | null = null;
  let initPromise: Promise<void> | null = null;
  let lastError: string | null = null;
  let seenLabels: string[] = [];

  function truncate(text: string): string {
    const tok = classifier?.tokenizer;
    if (!tok) return text;
    try {
      const ids = tok.encode(text, { add_special_tokens: false });
      const budget = Math.max(8, maxTokens - 2); // room for <s> and </s>
      if (ids.length <= budget) return text;
      return tok.decode(ids.slice(0, budget), { skip_special_tokens: true });
    } catch {
      // Rough fallback: ~0.75 words per token.
      return text.split(/\s+/).slice(0, Math.floor(maxTokens * 0.75)).join(' ');
    }
  }

  function aiProb(out: unknown): number {
    // Single input with top_k null -> [{label, score}, ...]; some versions nest once more.
    let rows = out as { label: string; score: number }[] | { label: string; score: number }[][];
    if (Array.isArray(rows) && Array.isArray(rows[0])) rows = rows[0] as { label: string; score: number }[];
    const list = (Array.isArray(rows) ? rows : [rows]) as { label: string; score: number }[];
    seenLabels = list.map((r) => r.label);
    const ai = list.find((r) => aiLabels.includes(String(r.label).toLowerCase()));
    if (ai) return ai.score;
    const human = list.find((r) => HUMAN_LABELS.includes(String(r.label).toLowerCase()));
    if (human) return 1 - human.score;
    return 0;
  }

  const scorer: RobertaScorer = {
    id: 'roberta',
    get available() {
      return classifier !== null;
    },
    get lastError() {
      return lastError;
    },
    get seenLabels() {
      return seenLabels;
    },
    init() {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        if (!lb.enabled) {
          lastError = 'layer B disabled in config';
          return;
        }
        try {
          const tf = await import('@huggingface/transformers');
          const env = tf.env as any;
          const host = String(lb.modelHost || '');
          env.allowLocalModels = true;
          env.localModelPath = chrome.runtime.getURL('models/');
          env.allowRemoteModels = !!host;
          if (host) env.remoteHost = host;
          if (env.backends?.onnx?.wasm) {
            env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('ort/');
            env.backends.onnx.wasm.numThreads = 1;
          }
          classifier = (await (tf.pipeline as any)('text-classification', modelId, {
            dtype,
            device,
          })) as Classifier;
        } catch (err) {
          classifier = null;
          lastError = err instanceof Error ? err.message : String(err);
          console.warn('[unslop] layer B unavailable:', lastError);
        }
      })();
      return initPromise;
    },
    async score(chunks: string[]): Promise<number[]> {
      await scorer.init();
      if (!classifier) throw new Error('layer B unavailable');
      const out: number[] = [];
      for (const c of chunks) {
        const res = await classifier(truncate(c), { top_k: null });
        out.push(aiProb(res));
      }
      return out;
    },
  };
  return scorer;
}

/** Shared instance used by the text check in the offscreen document. */
export const robertaScorer = createRobertaScorer();
