// Shapes for the YouTube comment-copies check (repeated comments across the whole video).

export interface VideoComment {
  /** YouTube comment id. Replies are "<parentId>.<replyId>", same as the `lc=` link on the page. */
  id: string;
  /** Display name, e.g. "@handle". Used to count distinct accounts. */
  author: string;
  text: string;
  reply: boolean;
}

/**
 * exact: same text after normalising (case, punctuation, emoji, links, @mentions).
 * near: most meaningful words shared.
 * campaign: the same promoted name (letters mixed with digits like AMS39K, or $TICKER) from several accounts.
 */
export type CopyKind = 'exact' | 'near' | 'campaign';

export interface CopyGroup {
  kind: CopyKind;
  /** The promoted name for campaign groups (upper case), else null. */
  label: string | null;
  ids: string[];
  /** Distinct authors in the group. */
  authors: number;
}

export interface GroupOptions {
  /** Comments shorter than this (after normalising) are not counted ("lol", "first"). */
  minChars?: number;
  /** Share of meaningful words two comments must have in common to be near-copies. */
  nearThreshold?: number;
  /** Near-copy matching only applies to comments with at least this many meaningful words. */
  nearMinWords?: number;
  /** A promoted name must appear in this many comments from this many accounts. */
  campaignMin?: number;
  /** Cap on how many comments a word may appear in and still be used to find near-copies (quick passes). */
  maxDf?: number;
}
