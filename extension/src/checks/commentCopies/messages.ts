// Port protocol between the YouTube content controller and the service worker (port name below).
import type { CopyGroup, VideoComment } from './types';

export const COMMENT_COPIES_PORT = 'comment-copies';

/** chrome.storage.local keys. The API key never leaves this browser except in requests to googleapis.com. */
export const YT_STORAGE = { apiKey: 'ytApiKey', useApi: 'ytUseApi', devMode: 'ytDevMode' } as const;

// Content -> worker
export type CopiesRequest =
  | { type: 'copies/reset'; run: number }
  | { type: 'copies/add'; run: number; comments: VideoComment[] }
  | { type: 'copies/group'; run: number; final: boolean }
  | { type: 'copies/apiScan'; run: number; videoId: string };

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
