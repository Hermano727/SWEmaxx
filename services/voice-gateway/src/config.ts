import "dotenv/config"

export const config = {
  port: Number(process.env.PORT ?? "8787") || 8787,
  voiceWsPath: process.env.VOICE_WS_PATH ?? "/ws/voice",
  healthPath: process.env.HEALTH_PATH ?? "/healthz",

  databaseUrl: process.env.DATABASE_URL ?? "",
  databaseSsl: process.env.DATABASE_SSL === "true",

  deepgramApiKey: process.env.DEEPGRAM_API_KEY ?? "",
  deepgramModel: process.env.DEEPGRAM_MODEL ?? "flux-general-en",

  // OpenAI for interviewer responses (same key used by Next app)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "",

  // Cache ownership checks in-memory briefly to reduce Firestore reads.
  ownershipCacheTtlMs: Number(process.env.OWNERSHIP_CACHE_TTL_MS ?? "60000") || 60_000,

  // Optional: delay committing an utterance after Deepgram speech_final if user is typing.
  typingCommitDelayMs: Number(process.env.TYPING_COMMIT_DELAY_MS ?? "450") || 450,
} as const

