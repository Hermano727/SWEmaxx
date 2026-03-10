import type OpenAI from "openai"
import { toFile } from "openai"
import { getOpenAIClient } from "./scorecardAdapter"

/**
 * Normalized contract for speech-to-text providers used by the interview flow.
 *
 * Expectations:
 * - `audio` is a single, self-contained chunk (already batched if needed) in a
 *   browser-friendly container such as WebM/Opus.
 * - `mimeType` reflects the container/codec but providers must not rely on it
 *   for correctness; it is primarily a hint.
 * - `language` is an optional BCP-47 language code (e.g. "en", "en-US") that
 *   providers may pass through to the underlying model.
 *
 * Semantics:
 * - On success, `text` is always a **trimmed** UTF-8 string.
 * - `text === ""` represents either silence/too-short/unsupported audio or
 *   a provider-specific "no transcript" condition.
 * - Provider-specific short/unsupported-audio errors (e.g. OpenAI 400s for
 *   sub-0.1s clips) MUST be normalized to `{ text: "" }` instead of throwing.
 * - All other errors SHOULD throw so callers can surface a single generic
 *   failure message to the user and optionally log details server-side.
 */
export type STTProvider = {
  transcribeChunk(params: {
    audio: Buffer
    mimeType: string
    language?: string
  }): Promise<{ text: string }>
}

class OpenAIWhisperProvider implements STTProvider {
  private client: OpenAI | null

  constructor(clientOverride?: OpenAI | null) {
    this.client = clientOverride ?? getOpenAIClient()
  }

  async transcribeChunk(params: {
    audio: Buffer
    mimeType: string
    language?: string
  }): Promise<{ text: string }> {
    const client = this.client
    if (!client) {
      throw new Error(
        "STT provider is not configured (missing OPENAI_API_KEY for Whisper)."
      )
    }

    const { audio, mimeType, language } = params

    const upload = await toFile(
      audio,
      // File name is mostly advisory but keeping the webm container in the name
      // makes it clear what we're sending to the provider.
      "audio-chunk.webm"
    )

    const baseModel = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe"

    try {
      const transcription = await client.audio.transcriptions.create({
        model: baseModel,
        file: upload,
        language,
      })

      const text =
        typeof (transcription as any).text === "string"
          ? ((transcription as any).text as string).trim()
          : ""

      return { text }
    } catch (e) {
      const status = (e as any)?.status
      const message: string = String(
        (e as any)?.error?.message ?? (e as any)?.message ?? ""
      )

      const isShortOrUnsupportedAudioError =
        status === 400 &&
        (message.includes("audio duration") ||
          message.includes("Audio file might be corrupted or unsupported"))

      // Treat short/unsupported chunks as "no transcript" instead of hard failure.
      if (isShortOrUnsupportedAudioError) {
        // eslint-disable-next-line no-console
        console.warn("[stt] Skipping short/unsupported audio chunk:", message)
        return { text: "" }
      }

      throw e
    }
  }
}

export function getSTTProvider(): STTProvider {
  const provider = process.env.STT_PROVIDER ?? "openai_whisper"
  if (provider === "openai_whisper") {
    return new OpenAIWhisperProvider()
  }
  throw new Error(`Unsupported STT_PROVIDER: ${provider}`)
}

