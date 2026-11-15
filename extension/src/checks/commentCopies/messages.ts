// Port protocol between the comment-copies content controller and the service worker (port name below).
import type { CopyGroup, VideoComment } from './types';

export const COMMENT_COPIES_PORT = 'comment-copies';

/** chrome.storage.local keys. The API key never leaves this browser except in requests to googleapis.com. */
export const YT_STORAGE = { apiKey: 'ytApiKey', useApi: 'ytUseApi', devMode: 'ytDevMode' } as const;

/** chrome.storage.session key the worker writes the tab's CopiesStatus to (read by the popup). */
export const copiesStatusKey = (tabId: number) => `copies:${tabId}`;

/** Fetch counters, filled by the fetchers. */
export interface FetchStats {
  requests: number;
  retries: number;
  lastStatus: number | null; // last HTTP status seen
  lastError: string | null;
}

/** What the popup shows: progress and result for the tab, plus debug numbers for Developer options. */
export interface CopiesStatus {
  site: string; // 'YouTube' | 'Reddit'
  pageId: string;
  phase: 'loading' | 'done' | 'stopped';
  source: 'api' | 'page' | 'json'; // API key, YouTube page requests, Reddit JSON
  apiNote: string | null; // why the API was not used: 'nokey', 'disabled', or its error
  comments: number;
  replies: number;
  groups: number;
  inGroups: number; // loaded comments that belong to a repeat group
  repeats: number; // ...that are flagged at the current sensitivity
  repeatGroups: number;
  biggest: number; // size of the largest group
  onPage: number; // comment elements on the page
  withId: number;
  inGroupsOnPage: number;
  flagged: number;
  noHeader: number; // in a group, but nowhere to put the pill
  fetch: FetchStats;
  lastGroupMs: number;
  secs: number;
  updatedAt: number;
}

// Content -> worker
export type CopiesRequest =
  | { type: 'copies/reset'; run: number }
  | { type: 'copies/add'; run: number; comments: VideoComment[] }
  | { type: 'copies/group'; run: number; final: boolean; nearThreshold?: number }
  | { type: 'copies/apiScan'; run: number; videoId: string }
  | { type: 'copies/status'; status: CopiesStatus | null };

// Worker -> content
export type ApiStatus = 'data' | 'done' | 'nokey' | 'disabled' | 'error';
export type CopiesResponse =
  | { type: 'copies/groups'; run: number; final: boolean; groups: CopyGroup[]; ms: number }
  | {
      type: 'copies/api';
      run: number;
      status: ApiStatus;
      comments?: VideoComment[];
      reason?: string;
      calls?: number;
    };
