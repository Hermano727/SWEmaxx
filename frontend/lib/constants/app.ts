export const LIVE_INTERVIEWER_LIMITS = {
  maxMessagesPerInterview: 5,
  minOnDemandSpacingMs: 20_000,
  minAutoSpacingMs: 180_000,
  autoTranscriptWindowMs: 2 * 60 * 1000,
  autoMinGapSinceLastTranscriptMs: 30_000,
  autoTranscriptMinChars: 40,
} as const

/** Flush buffered transcript after this many ms of no new final segments. */
export const TRANSCRIPT_SILENCE_FLUSH_MS = 8_000

/** Flush immediately if buffer exceeds this length so long monologues are not held. */
export const TRANSCRIPT_MAX_BUFFER_CHARS = 1_500

