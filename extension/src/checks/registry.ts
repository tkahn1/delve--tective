// The one list of enabled checks, in order. To add, remove or reorder a check, edit this file.
import type { Check } from './types';
import { siteListCheck } from './siteList';
import { copyCheck } from './copy';
import { textCheck } from './text';

export const checks: Check[] = [siteListCheck, copyCheck, textCheck];
