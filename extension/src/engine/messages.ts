// Message protocol shared by content scripts, popup, report, service worker and offscreen engine.
import type { Evidence, Level, PageInput, ReasonRef, SpanFlag } from '../checks/types';
import type { Stats } from '../storage/stats';

export type { Stats };

// ---------- Shared shapes ----------

export interface Settings {
  enabled: boolean;
  mode: 'dim' | 'hide';
  disabledSites: string[];
}

export const DEFAULT_SETTINGS: Settings = { enabled: true, mode: 'dim', disabledSites: [] };

export interface ResultVerdict {
  flagged: boolean;
  level: Level | null;
  reasons: ReasonRef[]; // <= 2
}

export interface PageVerdict {
  level: Level | null;
  segments: number;
  reasons: ReasonRef[];
  spans: SpanFlag[];
  chunkCount: number;
  done: boolean;
  settingUp: boolean;
}

export interface TabState {
  kind: 'search' | 'page';
  domain: string;
  level: Level | null;
  segments: number;
  reasons: ReasonRef[];
  dimmed: number;
  total: number;
}

export const tabStateKey = (tabId: number): string => `tab:${tabId}`;

export const PAGE_CHECK_PORT = 'page-check';

export type EngineStatus = 'loading' | 'ready' | 'unavailable';

// ---------- Content / popup / report -> SW (chrome.runtime.sendMessage) ----------

export interface SearchCheckMsg {
  type: 'search/check';
  results: PageInput[];
}
export interface SearchCheckResponse {
  verdicts: ResultVerdict[];
}
export interface SettingsGetMsg {
  type: 'settings/get';
}
export interface SettingsSetMsg {
  type: 'settings/set';
  patch: Partial<Settings>;
}
export interface PopupOpenMsg {
  type: 'popup/open';
}
export interface TabStateMsg {
  type: 'tab/state';
  tabId: number;
}
export interface StatsGetMsg {
  type: 'stats/get';
}

export type WorkerRequest =
  | SearchCheckMsg
  | SettingsGetMsg
  | SettingsSetMsg
  | PopupOpenMsg
  | TabStateMsg
  | StatsGetMsg;

/** Maps each request type to its response type. */
export interface WorkerResponses {
  'search/check': SearchCheckResponse;
  'settings/get': Settings;
  'settings/set': Settings;
  'popup/open': { ok: boolean };
  'tab/state': TabState | null;
  'stats/get': Stats;
}

// ---------- SW -> tabs / runtime broadcast ----------

export interface SettingsChangedMsg {
  type: 'settings/changed';
  settings: Settings;
}

// ---------- Page check over Port 'page-check' ----------

export interface PageCheckMsg {
  type: 'page/check';
  input: PageInput;
}
export interface PageVerdictMsg {
  type: 'page/verdict';
  verdict: PageVerdict;
}

// ---------- SW <-> offscreen engine ----------

export interface EngineRunMsg {
  target: 'engine';
  type: 'engine/run';
  reqId: string;
  input: PageInput;
}
export interface EngineWarmupMsg {
  target: 'engine';
  type: 'engine/warmup';
}
export type EngineRequest = EngineRunMsg | EngineWarmupMsg;

export interface EnginePartialMsg {
  target: 'worker';
  type: 'engine/partial';
  reqId: string;
  evidence: Evidence;
}
export interface EngineDoneMsg {
  target: 'worker';
  type: 'engine/done';
  reqId: string;
  evidence: Evidence | null;
}
export interface EngineStatusMsg {
  target: 'worker';
  type: 'engine/status';
  status: EngineStatus;
}
export type EngineToWorker = EnginePartialMsg | EngineDoneMsg | EngineStatusMsg;

// ---------- Helpers ----------

/** Typed wrapper around chrome.runtime.sendMessage for requests handled by the SW. */
export function sendToWorker<M extends WorkerRequest>(msg: M): Promise<WorkerResponses[M['type']]> {
  return chrome.runtime.sendMessage(msg) as Promise<WorkerResponses[M['type']]>;
}

export function isEngineToWorker(msg: unknown): msg is EngineToWorker {
  return !!msg && typeof msg === 'object' && (msg as { target?: unknown }).target === 'worker';
}

export function isEngineRequest(msg: unknown): msg is EngineRequest {
  return !!msg && typeof msg === 'object' && (msg as { target?: unknown }).target === 'engine';
}

export function emptyPageVerdict(partial: Partial<PageVerdict> = {}): PageVerdict {
  return { level: null, segments: 0, reasons: [], spans: [], chunkCount: 0, done: true, settingUp: false, ...partial };
}
