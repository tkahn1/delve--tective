export type Target = 'result' | 'page';
export type Level = 'low' | 'medium' | 'high';
export type TemplateId =
  | 'siteList.listed'
  | 'siteList.builder'
  | 'copy.sameArticle'
  | 'copy.sameTitle'
  | 'text.page'
  | 'text.chunk';

export interface ReasonRef {
  templateId: TemplateId;
  values?: Record<string, number | string>;
}

export interface SpanFlag {
  chunkIndex: number;
  score: number;
  reasons: ReasonRef[];
}

export interface DomClues {
  generators: string[];
  scriptHosts: string[];
}

export interface Evidence {
  checkId: string;
  score: number; // 0 = clean, 1 = strong signal
  confidence: 'low' | 'medium' | 'high';
  reasons: ReasonRef[];
  spans?: SpanFlag[];
}

export interface PageInput {
  target: Target;
  url: string; // already mapped through config.urlMap (saved demo pages)
  domain: string; // registrable domain of url, e.g. "mayfairfarms.com"
  title: string;
  query?: string; // search query (results only)
  chunks?: string[]; // opened pages only: merged 80-250 word chunks, index = chunkIndex
  clues?: DomClues; // opened pages only
  siblings?: { title: string; domain: string }[]; // all results on the search page (incl. self)
}

export interface CheckContext {
  onPartial?(e: Evidence): void;
}

export interface Check {
  id: string;
  targets: Target[];
  runsIn: 'worker' | 'engine'; // worker = service worker, engine = offscreen document
  init?(): Promise<void>;
  run(input: PageInput, ctx?: CheckContext): Promise<Evidence | null>; // null = not applicable
}
