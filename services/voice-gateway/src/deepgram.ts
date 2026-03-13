import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk"
import { config } from "./config.js"
import { log } from "./logger.js"

export type DeepgramCallbacks = {
  onPartial?: (text: string) => void
  onFinalSegment?: (text: string) => void
  onSpeechFinal?: () => void
  onError?: (err: unknown) => void
  onClose?: (code: number, reason: string) => void
}

export type DeepgramLiveSession = {
  sendAudio: (chunk: Uint8Array) => void
  close: () => void
}

export function startDeepgramLive(
  callbacks: DeepgramCallbacks,
  options?: { model?: string }
): DeepgramLiveSession {
  if (!config.deepgramApiKey) {
    throw new Error("Missing DEEPGRAM_API_KEY")
  }

  const dg = createClient(config.deepgramApiKey)

  // Deepgram WebM/Opus is containerized; docs recommend omitting encoding/sample_rate.
  // Force English to avoid background music language bleed.
  const connection = dg.listen.live({
    model: options?.model ?? config.deepgramModel,
    language: "en-US",
    smart_format: true,
    punctuate: true,
    interim_results: true,
    endpointing: 300,
    vad_events: true,
  })

  connection.on(LiveTranscriptionEvents.Open, () => {
    log("info", "deepgram_open")
  })

  connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    const alt = data?.channel?.alternatives?.[0]
    const transcript: string = typeof alt?.transcript === "string" ? alt.transcript : ""
    if (!transcript.trim()) return

    const isFinal = Boolean(data?.is_final)
    const speechFinal = Boolean(data?.speech_final)

    if (isFinal) callbacks.onFinalSegment?.(transcript.trim())
    else callbacks.onPartial?.(transcript.trim())

    if (speechFinal) callbacks.onSpeechFinal?.()
  })

  connection.on(LiveTranscriptionEvents.Error, (err: unknown) => {
    log("error", "deepgram_error", { err: String((err as any)?.message ?? err) })
    callbacks.onError?.(err)
  })

  connection.on(LiveTranscriptionEvents.Close, (code: number, reason: string) => {
    log("warn", "deepgram_close", { code, reason })
    callbacks.onClose?.(code, reason)
  })

  return {
    sendAudio: (chunk: Uint8Array) => {
      try {
        // Deepgram SDK expects a socket-data type; Buffer is safest in Node.
        connection.send(Buffer.from(chunk) as any)
      } catch (e) {
        callbacks.onError?.(e)
      }
    },
    close: () => {
      try {
        connection.finish()
      } catch {
        // ignore
      }
    },
  }
}

