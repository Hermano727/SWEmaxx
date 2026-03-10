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

/**
 * Tunables for backend STT capture via MediaRecorder. These live here so we can
 * adjust behavior (latency vs. chunk size) without touching the hook logic.
 */
export const STT_MEDIARECORDER_TIMESLICE_MS = 1_000

/**
 * Maximum combined audio payload we will send in a single STT request from the
 * browser. Kept comfortably below the server-side STT_MAX_CHUNK_BYTES default
 * (512 KiB) so batches don't get rejected for size.
 */
export const STT_MAX_COMBINED_CHUNK_BYTES = 200_000

/**
 * Minimum combined payload we consider worth sending to STT. Extremely small
 * fragments usually correspond to key taps or pure silence and tend to fall
 * below the model's minimum duration threshold anyway.
 */
export const STT_MIN_COMBINED_CHUNK_BYTES = 2_000

/**
 * Silence threshold (in ms) used to decide when a spoken utterance has
 * finished in the backend STT flow. Shorter than TRANSCRIPT_SILENCE_FLUSH_MS
 * so the live interviewer can respond to thoughts in near-real-time.
 */
export const STT_UTTERANCE_SILENCE_MS = 1_800

