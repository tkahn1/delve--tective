export interface TextScorer {
  id: string;
  init?(): Promise<void>;
  /** One score in 0..1 per chunk, same order as the input. */
  score(chunks: string[]): Promise<number[]>;
}
