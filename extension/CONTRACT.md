# Unslop extension — shared contract (all agents build against this)

Source plan: C:\Users\johna\Downloads\unslop-plan.pdf (read pages as needed with the pages param).
Stack: Vite 6+ / @crxjs/vite-plugin, TypeScript, MV3, Vitest. Package dir: `extension/`. Paths below are relative to `extension/src/`.
No emoji, stroke-SVG icons only. Never say "fake"/"AI-written"; say "worth a second look". Mark shortcuts `// TODO(hack):`.
Colors: ink #18181B, secondary #3F3F46/#52525B, dimmed #71717A, border #E4E4E7, soft panel #F4F4F5, flag #EA580C, flag text #7C2D12, flag tint #FFF7ED, links #1D4ED8.
Fonts: Inter (body), Space Grotesk 600-700 (headings/numbers), bundled via @fontsource/inter and @fontsource/space-grotesk.

## checks/types.ts
```ts
export type Target = 'result' | 'page';
export type Level = 'low' | 'medium' | 'high';
export type TemplateId = 'siteList.listed' | 'siteList.builder' | 'copy.sameArticle' | 'copy.sameTitle' | 'text.page' | 'text.chunk';
export interface ReasonRef { templateId: TemplateId; values?: Record<string, number | string>; }
export interface SpanFlag { chunkIndex: number; score: number; reasons: ReasonRef[]; }
export interface DomClues { generators: string[]; scriptHosts: string[]; }
export interface Evidence { checkId: string; score: number; confidence: 'low'|'medium'|'high'; reasons: ReasonRef[]; spans?: SpanFlag[]; }
export interface PageInput {
  target: Target;
  url: string;            // already mapped through config.urlMap (saved demo pages)
  domain: string;         // registrable domain of url, e.g. "mayfairfarms.com"
  title: string;
  query?: string;         // search query (results only)
  chunks?: string[];      // opened pages only: merged 80-250 word chunks, index = chunkIndex
  clues?: DomClues;       // opened pages only
  siblings?: { title: string; domain: string }[]; // all results on the search page (incl. self)
}
export interface CheckContext { onPartial?(e: Evidence): void; }
export interface Check {
  id: string;
  targets: Target[];
  runsIn: 'worker' | 'engine';   // worker = service worker, engine = offscreen document
  init?(): Promise<void>;
  run(input: PageInput, ctx?: CheckContext): Promise<Evidence | null>; // null = not applicable
}
```
## checks/registry.ts
`export const checks: Check[] = [siteListCheck, copyCheck, textCheck];` (imports `./siteList`, `./copy`, `./text`; each index.ts default-exports... NO: named exports `siteListCheck`, `copyCheck`, `textCheck`). Check ids: 'siteList', 'copy', 'text'.
Text check's RoBERTa scorer must import `@huggingface/transformers` lazily (dynamic import inside init) so the service worker bundle never loads it.

## util/domain.ts
`registrableDomain(hostname: string): string` (strip www., handle common 2-part suffixes co.uk, com.au, etc.), `isAllowlisted(domain): boolean` (uses data/allowlist.json, also matches parent domains).

## data/ (JSON shipped in bundle, written by pipeline/)
- `sites.json`: `{ "<domain>": "farm" | "builder" }`
- `allowlist.json`: `string[]`
- `builders.json`: `{ generators: string[] /* lowercase substrings */, scriptHosts: string[] }`
- `copies.json`: `{ "<band>:<hex8>": <clusterSize> }`
- `copy_urls.json`: `{ "<normalizedUrl>": <clusterSize> }`  normalizedUrl = host without www + pathname without trailing slash + search, lowercase.

## MinHash spec (TS checks/copy/minhash.ts and Python pipeline MUST match bit-for-bit)
- tokens: lowercase, replace any char not [a-z0-9] with space, split on whitespace, drop empties.
- shingles: every 5 consecutive tokens joined with single space (if <5 tokens: no shingles).
- base hash: FNV-1a 32-bit over the UTF-8 bytes of the shingle (offset 0x811c9dc5, prime 0x01000193), unsigned.
- 128 hash functions, i = 0..127: seed_i = (imul(i+1, 0x9e3779b1)) >>> 0; h = x ^ seed_i; h = imul(h ^ (h>>>16), 0x85ebca6b); h = imul(h ^ (h>>>13), 0xc2b2ae35); h = (h ^ (h>>>16)) >>> 0. signature[i] = min over shingles.
- LSH: 32 bands x 4 rows. band key = `${b}:${hex8}` where hex8 = FNV-1a 32 over the 16 bytes of the 4 uint32 values (little-endian), lowercase 8-char hex.
- similarity(a,b) = fraction of equal signature slots.

## config/detectors.config.ts  (`export const config = {...} as const`-ish, typed)
```ts
weights: { siteList: 0.7, copy: 0.6, text: 0.5, textLayerAOnly: 0.15 },
levels: { medium: 0.4, high: 0.6 },   // score < medium => low
resultFlagLevel: 'medium',           // results at/above this are dimmed
maxResultReasons: 2,
copy: { numHashes: 128, shingle: 5, bands: 32, rows: 4, urlScore: 0.9, articleScore: 1, titleScore: 0.7, minTitleDomains: 3, minLeftoverWords: 2 },
text: { minWords: 50, chunkMin: 80, chunkMax: 250, maxChunks: 6, maxTokens: 256, minFlaggedChunks: 2,
  layerA: { passThreshold: 0.3 },
  layerB: { enabled: true, threshold: 0.9, modelId: 'fakespot-roberta', modelHost: '' /* '' => bundled at public/models/ */, device: 'wasm', dtype: 'q8', aiLabels: ['AI', 'LABEL_1', 'Fake'] } },
urlMap: { 'google-coffee-grinder.html': 'https://www.google.com/search?q=best+coffee+grinder+2026', 'mayfairfarms.html': 'https://www.mayfairfarms.com/?p=73153', 'peggyomara.html': 'https://www.peggyomara.com/best-coffee-grinders/', 'google-air-fryer.html': 'https://www.google.com/search?q=best+air+fryer+2026' },
// urlMap keys are file basenames; applies only when page is file:// or localhost/127.0.0.1
```
## combine/combine.ts
`combine(evidence: Evidence[]): { score: number; level: Level | null; segments: number; reasons: ReasonRef[] }`
score = min(1, sum(weights[checkId] * e.score)) (text uses `textLayerAOnly` weight when evidence.confidence==='low' and no spans). level null when no evidence with score>0. segments: low 1-2 (score<0.2 =>1 else 2), medium 3, high 4 (score<0.85) or 5. reasons ordered by weighted contribution. Also `levelAtLeast(level, min)`.

## reasons/templates.ts
TEMPLATES: siteList.listed "on the shared junk-site list"; siteList.builder "site built with an AI site builder"; copy.sameArticle "same article appears on {n} other sites"; copy.sameTitle "same title as {n} other results on this page"; text.page "{k} of {n} paragraphs flagged by the text check"; text.chunk "Flagged by the text check".
`fillReason(ref): string`, `capitalize(s)`.

## Messages (engine/messages.ts exports these types + helpers)
Settings `{ enabled: boolean; mode: 'dim' | 'hide'; disabledSites: string[] }` default {true,'dim',[]}.
ResultVerdict `{ flagged: boolean; level: Level | null; reasons: ReasonRef[] /* <= 2 */ }`.
PageVerdict `{ level: Level | null; segments: number; reasons: ReasonRef[]; spans: SpanFlag[]; chunkCount: number; done: boolean; settingUp: boolean }`.
TabState `{ kind: 'search' | 'page'; domain: string; level: Level | null; segments: number; reasons: ReasonRef[]; dimmed: number; total: number }` stored in chrome.storage.session key `tab:<id>`.
Content -> SW (chrome.runtime.sendMessage):
- `{type:'search/check', results: PageInput[]}` -> `{ verdicts: ResultVerdict[] }`. SW also updates stats (dedup by url per tab) and toolbar badge count, TabState.
- `{type:'settings/get'}` -> Settings;  `{type:'settings/set', patch: Partial<Settings>}` -> Settings. SW then broadcasts `{type:'settings/changed', settings}` to every tab (chrome.tabs.sendMessage) and runtime.
- `{type:'popup/open'}` -> SW calls chrome.action.openPopup() (fallback: open popup page in a tab).
- `{type:'tab/state', tabId}` (from popup) -> TabState | null.  `{type:'stats/get'}` -> Stats.
Page check over a Port named `'page-check'`: content posts `{type:'page/check', input: PageInput}`; SW posts back `{type:'page/verdict', verdict: PageVerdict}` one or more times (progressive, last has done:true). SW runs worker checks itself, forwards engine checks to the offscreen doc.
SW <-> offscreen (chrome.runtime messages with `target:'engine'` / `target:'worker'`):
- SW->engine `{target:'engine', type:'engine/run', reqId, input}`, `{target:'engine', type:'engine/warmup'}`
- engine->SW `{target:'worker', type:'engine/partial', reqId, evidence}`, `{target:'worker', type:'engine/done', reqId, evidence: Evidence|null}`, `{target:'worker', type:'engine/status', status: 'loading'|'ready'|'unavailable'}`
Offscreen doc: `src/engine/offscreen.html`, reasons ['WORKERS'].

## Stats (storage/stats.ts, chrome.storage.local key 'stats', written ONLY by SW)
`Stats = { days: Record<'YYYY-MM-DD', DayStats> }`; `DayStats = { dimmed: number; pagesFlagged: number; pagesHigh: number; paragraphs: number; reasons: Record<TemplateId, number>; domains: Record<string, { count: number; reasons: Record<string, number> }> }`. Domains and counts only, never URLs or text. Helpers: `recordResults(items: {domain, templateIds}[])`, `recordPage({domain, level, paragraphs, templateIds})`, `getStats()`, `summarize(stats, range: 'week'|'month'|'all')` -> `{ totals:{dimmed,pagesHigh,paragraphs,pagesFlagged}, daily: {label, value}[] (7 days Mon..Sun for week; per-week for month/all), topDomains: {domain,count,reason: TemplateId}[] (4), reasons: {templateId,count}[] }`.

## UI in pages
Everything injected lives in Shadow DOM roots. Fonts in shadow DOM: register via `new FontFace('UnslopInter', 'url(chrome-extension://.../x.woff2)')` + document.fonts.add (font files in web_accessible_resources).
