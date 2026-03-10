"use client"

import { useEffect, useRef, useState } from "react"
import { getCurrentIdToken } from "@/lib/firebase/auth"
import {
  TRANSCRIPT_MAX_BUFFER_CHARS,
  TRANSCRIPT_SILENCE_FLUSH_MS,
  STT_MAX_COMBINED_CHUNK_BYTES,
  STT_MEDIARECORDER_TIMESLICE_MS,
  STT_MIN_COMBINED_CHUNK_BYTES,
  STT_UTTERANCE_SILENCE_MS,
} from "@/lib/constants/app"
import type { TranscriptMode } from "@/lib/db/postgres"
import type { InterviewPhase } from "@/lib/interview/types"

type UseContinuousTranscriptCaptureOptions = {
  sessionId?: string
  enabled: boolean
  mode: TranscriptMode
  company?: string
  problemId?: string
  problemTitle?: string
  phase?: InterviewPhase
  isTyping?: boolean
}

export type VoiceGatewayInterviewerMessage = {
  id: string
  kind: "question" | "hint" | "meta_feedback"
  text: string
}

type UseContinuousTranscriptCaptureState = {
  isSupported: boolean
  isRecording: boolean
  error: string | null
  transcriptPreview: string
  voiceGateway: {
    isConnected: boolean
    requestInterviewerFeedback: (params: {
      codeSnapshot?: string
      meta?: {
        phase?: InterviewPhase
        elapsedSeconds?: number | null
        company?: string
        problemTitle?: string
      }
    }) => Promise<VoiceGatewayInterviewerMessage | null>
  } | null
}

type SendParams = {
  sessionId: string
  mode: TranscriptMode
  company?: string
  problemId?: string
  problemTitle?: string
  phase?: InterviewPhase
  onError: (message: string) => void
}

// Uses the Web Speech API (browser-dependent quality). For best accuracy, a future
// option is cloud STT (e.g. OpenAI Whisper) via a backend that receives audio chunks.
export function useContinuousTranscriptCapture(
  options: UseContinuousTranscriptCaptureOptions
): UseContinuousTranscriptCaptureState {
  const {
    sessionId,
    enabled,
    mode,
    company,
    problemId,
    problemTitle,
    phase,
    isTyping,
  } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptPreview, setTranscriptPreview] = useState("")
  const [wsConnected, setWsConnected] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const pendingBlobsRef = useRef<Blob[]>([])
  const isUploadingRef = useRef(false)

  const voiceWsRef = useRef<WebSocket | null>(null)
  const interviewerResponseResolverRef = useRef<((m: VoiceGatewayInterviewerMessage | null) => void) | null>(null)
  const interviewerResponseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recognitionRef = useRef<any>(null)
  const shouldRestartRef = useRef(false)
  const bufferRef = useRef("")
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendParamsRef = useRef<SendParams | null>(null)

  const backendEnabled =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_STT_BACKEND_ENABLED === "true"

  const wsTransportEnabled =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_STT_TRANSPORT === "ws" &&
    typeof process.env.NEXT_PUBLIC_VOICE_WS_URL === "string" &&
    process.env.NEXT_PUBLIC_VOICE_WS_URL.length > 0

  const flushBuffer = () => {
    if (silenceTimerRef.current != null) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    const text = bufferRef.current.trim()
    if (!text) return
    bufferRef.current = ""
    const params = sendParamsRef.current
    if (params) {
      void sendTranscriptChunk({
        sessionId: params.sessionId,
        text,
        mode: params.mode,
        company: params.company,
        problemId: params.problemId,
        problemTitle: params.problemTitle,
        phase: params.phase,
        onError: params.onError,
      })
    }
  }

  useEffect(() => {
    if (!wsTransportEnabled) return
    if (typeof window === "undefined") return

    const wsUrl = process.env.NEXT_PUBLIC_VOICE_WS_URL as string

    const closeWs = () => {
      setWsConnected(false)
      if (voiceWsRef.current) {
        try {
          voiceWsRef.current.close()
        } catch {
          // ignore
        }
      }
      voiceWsRef.current = null
      if (interviewerResponseTimeoutRef.current) {
        clearTimeout(interviewerResponseTimeoutRef.current)
        interviewerResponseTimeoutRef.current = null
      }
      if (interviewerResponseResolverRef.current) {
        interviewerResponseResolverRef.current(null)
        interviewerResponseResolverRef.current = null
      }
    }

    // Connect on demand when we have a session and are enabled.
    if (!enabled || !sessionId) {
      closeWs()
      return
    }

    const ws = new WebSocket(wsUrl)
    ws.binaryType = "arraybuffer"
    voiceWsRef.current = ws

    ws.onopen = async () => {
      try {
        const token = await getCurrentIdToken()
        if (!token) {
          setError(
            "You’re not signed in. Return to setup and sign in, then start the interview again."
          )
          closeWs()
          return
        }

        ws.send(JSON.stringify({ type: "auth", token }))
        ws.send(
          JSON.stringify({
            type: "start",
            interviewId: sessionId,
            mode,
            company,
            problemId,
            problemTitle,
          })
        )

        setWsConnected(true)
        setError(null)
      } catch {
        setError("Failed to connect to voice service.")
        closeWs()
      }
    }

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return
      let msg: any
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      if (msg?.type === "stt_partial" || msg?.type === "stt_final_segment") {
        const text = typeof msg?.text === "string" ? msg.text.trim() : ""
        if (!text) return
        setTranscriptPreview((prev) => {
          const next = `${prev.trim()} ${text}`.trim()
          return next
        })
        return
      }

      if (msg?.type === "interviewer_message") {
        const payload = msg?.message
        const resolved =
          payload && typeof payload === "object"
            ? ({
                id: String(payload.id ?? ""),
                kind:
                  payload.kind === "hint" || payload.kind === "meta_feedback"
                    ? payload.kind
                    : "question",
                text: String(payload.text ?? "").trim(),
              } as VoiceGatewayInterviewerMessage)
            : null

        if (interviewerResponseTimeoutRef.current) {
          clearTimeout(interviewerResponseTimeoutRef.current)
          interviewerResponseTimeoutRef.current = null
        }
        if (interviewerResponseResolverRef.current) {
          interviewerResponseResolverRef.current(
            resolved && resolved.id && resolved.text ? resolved : null
          )
          interviewerResponseResolverRef.current = null
        }
        return
      }

      if (msg?.type === "error" && typeof msg?.error === "string") {
        setError(msg.error)
      }
    }

    ws.onerror = () => {
      setError("Voice service error.")
    }

    ws.onclose = () => {
      closeWs()
    }

    return () => {
      closeWs()
    }
  }, [
    wsTransportEnabled,
    enabled,
    sessionId,
    mode,
    company,
    problemId,
    problemTitle,
  ])

  useEffect(() => {
    if (!wsTransportEnabled) return
    if (!sessionId) return
    const ws = voiceWsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        type: "typing",
        interviewId: sessionId,
        isTyping: Boolean(isTyping),
      })
    )
  }, [wsTransportEnabled, sessionId, isTyping])

  useEffect(() => {
    if (!wsTransportEnabled) return
    if (typeof window === "undefined") return

    const hasMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof window.MediaRecorder !== "undefined"

    if (!hasMedia) return

    const startRecorder = async () => {
      if (!enabled || !sessionId || isRecording) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        mediaStreamRef.current = stream

        const options = { mimeType: "audio/webm;codecs=opus" }
        let recorder: MediaRecorder
        try {
          recorder = new MediaRecorder(stream, options)
        } catch {
          recorder = new MediaRecorder(stream)
        }

        mediaRecorderRef.current = recorder
        setError(null)

        recorder.ondataavailable = async (event: BlobEvent) => {
          if (!event.data || event.data.size === 0) return
          const ws = voiceWsRef.current
          if (!ws || ws.readyState !== WebSocket.OPEN) return
          const buf = await event.data.arrayBuffer()
          ws.send(buf)
        }

        recorder.onerror = () => {
          setError("Microphone error. Check browser permissions.")
        }

        recorder.onstart = () => setIsRecording(true)
        recorder.onstop = () => setIsRecording(false)

        // For streaming STT, lower latency chunks work better.
        recorder.start(250)
      } catch {
        setError("Failed to start microphone. Check browser permissions.")
      }
    }

    const stopRecorder = () => {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== "inactive") {
        recorder.stop()
      }
      mediaRecorderRef.current = null

      const stream = mediaStreamRef.current
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaStreamRef.current = null
    }

    if (enabled && sessionId && !isRecording) {
      void startRecorder()
    } else if ((!enabled || !sessionId) && isRecording) {
      stopRecorder()
    }

    return () => stopRecorder()
  }, [wsTransportEnabled, enabled, sessionId, isRecording])

  useEffect(() => {
    if (wsTransportEnabled) return
    if (backendEnabled) return
    if (typeof window === "undefined") return

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      null

    if (!SpeechRecognitionCtor) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)

    if (sessionId) {
      sendParamsRef.current = {
        sessionId,
        mode,
        company,
        problemId,
        problemTitle,
        phase,
        onError: (message) => setError(message),
      }
    } else {
      sendParamsRef.current = null
    }

    const recognition = new SpeechRecognitionCtor() as any
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.maxAlternatives = 2

    recognition.onresult = (event: any) => {
      let finalText = ""
      let interimText = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const alt =
            result.length > 1
              ? Array.from({ length: result.length }, (_, j) => result[j]).reduce(
                  (best, a) =>
                    (a.confidence ?? 0) > (best.confidence ?? 0) ? a : best,
                  result[0]
                )
              : result[0]
          finalText += alt.transcript ?? ""
        } else {
          interimText += result[0].transcript
        }
      }

      if (interimText) {
        setTranscriptPreview((prev) => {
          const next = `${prev.trim()} ${interimText.trim()}`.trim()
          return next
        })
      }

      if (finalText.trim()) {
        const chunk = finalText.trim()
        setTranscriptPreview((prev) => {
          const next = `${prev.trim()} ${chunk}`.trim()
          return next
        })

        bufferRef.current = (bufferRef.current + " " + chunk).trim()

        if (silenceTimerRef.current != null) {
          clearTimeout(silenceTimerRef.current)
        }
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null
          flushBuffer()
        }, TRANSCRIPT_SILENCE_FLUSH_MS)

        if (bufferRef.current.length >= TRANSCRIPT_MAX_BUFFER_CHARS) {
          flushBuffer()
        }
      }
    }

    recognition.onerror = (event: any) => {
      const message = (event && event.error) || "Speech recognition error"
      setError(message)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (shouldRestartRef.current && enabled && sessionId) {
        try {
          recognition.start()
          setIsRecording(true)
        } catch {
          // ignore restart failures; hook will surface errors on next start
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      shouldRestartRef.current = false
      if (silenceTimerRef.current != null) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (bufferRef.current.trim() && sendParamsRef.current) {
        const text = bufferRef.current.trim()
        bufferRef.current = ""
        const params = sendParamsRef.current
        void sendTranscriptChunk({
          sessionId: params.sessionId,
          text,
          mode: params.mode,
          company: params.company,
          problemId: params.problemId,
          problemTitle: params.problemTitle,
          phase: params.phase,
          onError: params.onError,
        })
      }
      try {
        recognition.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [sessionId, enabled, mode, company, problemId, problemTitle, phase])

  useEffect(() => {
    if (wsTransportEnabled) return
    if (backendEnabled) return
    if (!isSupported || !recognitionRef.current) return

    if (enabled && sessionId && !isRecording) {
      try {
        shouldRestartRef.current = true
        recognitionRef.current.start()
        setIsRecording(true)
        setError(null)
      } catch {
        setError("Failed to start microphone. Check browser permissions.")
      }
    } else if ((!enabled || !sessionId) && isRecording) {
      shouldRestartRef.current = false
      flushBuffer()
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsRecording(false)
    }
  }, [enabled, sessionId, isSupported, isRecording])

  useEffect(() => {
    if (wsTransportEnabled) return
    if (!backendEnabled) return
    if (typeof window === "undefined") return

    const hasMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof window.MediaRecorder !== "undefined"

    if (!hasMedia) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)

    if (sessionId) {
      sendParamsRef.current = {
        sessionId,
        mode,
        company,
        problemId,
        problemTitle,
        phase,
        onError: (message) => setError(message),
      }
    } else {
      sendParamsRef.current = null
    }

    const startRecorder = async () => {
      if (!enabled || !sessionId || isRecording) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream

        const options = { mimeType: "audio/webm;codecs=opus" }
        let recorder: MediaRecorder
        try {
          recorder = new MediaRecorder(stream, options)
        } catch {
          recorder = new MediaRecorder(stream)
        }

        mediaRecorderRef.current = recorder
        setError(null)

        const triggerUpload = async () => {
          if (isUploadingRef.current) return
          if (pendingBlobsRef.current.length === 0) return

          isUploadingRef.current = true
          try {
            while (pendingBlobsRef.current.length > 0) {
              let combinedSize = 0
              const batch: Blob[] = []

              while (
                pendingBlobsRef.current.length > 0 &&
                (batch.length === 0 ||
                  combinedSize + pendingBlobsRef.current[0]!.size <=
                    STT_MAX_COMBINED_CHUNK_BYTES)
              ) {
                const next = pendingBlobsRef.current.shift()
                if (!next) break
                if (next.size <= 0) {
                  continue
                }
                batch.push(next)
                combinedSize += next.size
              }

              if (batch.length === 0) {
                continue
              }

              // Drop extremely small combined fragments that are very unlikely to
              // clear the STT model's minimum duration threshold and mostly
              // represent key taps or pure silence.
              if (combinedSize < STT_MIN_COMBINED_CHUNK_BYTES) {
                continue
              }

              const blobToSend =
                batch.length === 1
                  ? batch[0]!
                  : new Blob(batch, { type: batch[0]!.type || "audio/webm" })

              const text = await sendAudioChunk({
                sessionId,
                blob: blobToSend,
                mode,
                company,
                problemId,
                problemTitle,
                phase,
                onError: (message) => setError(message),
              })

              if (text && text.trim()) {
                const chunk = text.trim()

                // Update on-screen preview immediately.
                setTranscriptPreview((prev) => {
                  const next = `${prev.trim()} ${chunk}`.trim()
                  return next
                })

                // Buffer backend STT text into utterance-sized chunks for
                // persistent transcripts and live interviewer consumption.
                bufferRef.current = (bufferRef.current + " " + chunk).trim()

                if (silenceTimerRef.current != null) {
                  clearTimeout(silenceTimerRef.current)
                }
                silenceTimerRef.current = setTimeout(() => {
                  silenceTimerRef.current = null
                  flushBuffer()
                }, STT_UTTERANCE_SILENCE_MS)

                if (bufferRef.current.length >= TRANSCRIPT_MAX_BUFFER_CHARS) {
                  flushBuffer()
                }
              }
            }
          } finally {
            isUploadingRef.current = false
          }
        }

        recorder.ondataavailable = (event: BlobEvent) => {
          if (!event.data || event.data.size === 0) return
          pendingBlobsRef.current.push(event.data)
          void triggerUpload()
        }

        recorder.onerror = () => {
          setError("Microphone error. Check browser permissions.")
        }

        recorder.onstart = () => {
          setIsRecording(true)
        }

        recorder.onstop = () => {
          setIsRecording(false)
        }

        // Emit chunks on a fixed cadence, then batch multiple blobs together
        // before sending to STT so we clear the model's minimum duration
        // threshold while keeping latency acceptable.
        recorder.start(STT_MEDIARECORDER_TIMESLICE_MS)
      } catch {
        setError("Failed to start microphone. Check browser permissions.")
      }
    }

    const stopRecorder = () => {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== "inactive") {
        recorder.stop()
      }
      mediaRecorderRef.current = null

      const stream = mediaStreamRef.current
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaStreamRef.current = null
    }

    if (enabled && sessionId && !isRecording) {
      void startRecorder()
    } else if ((!enabled || !sessionId) && isRecording) {
      // Flush any buffered text when the mic is disabled or the session ends
      // so we don't lose the tail of the last utterance.
      flushBuffer()
      stopRecorder()
    }

    return () => {
      flushBuffer()
      stopRecorder()
    }
  }, [
    backendEnabled,
    enabled,
    sessionId,
    isRecording,
    mode,
    company,
    problemId,
    problemTitle,
    phase,
  ])

  return {
    isSupported,
    isRecording,
    error,
    transcriptPreview,
    voiceGateway: wsTransportEnabled
      ? {
          isConnected: wsConnected,
          requestInterviewerFeedback: async (params) => {
            if (!sessionId) return null
            const ws = voiceWsRef.current
            if (!ws || ws.readyState !== WebSocket.OPEN) return null

            if (interviewerResponseTimeoutRef.current) {
              clearTimeout(interviewerResponseTimeoutRef.current)
              interviewerResponseTimeoutRef.current = null
            }

            const result = await new Promise<VoiceGatewayInterviewerMessage | null>(
              (resolve) => {
                interviewerResponseResolverRef.current = resolve
                interviewerResponseTimeoutRef.current = setTimeout(() => {
                  interviewerResponseTimeoutRef.current = null
                  if (interviewerResponseResolverRef.current) {
                    interviewerResponseResolverRef.current(null)
                    interviewerResponseResolverRef.current = null
                  }
                }, 15_000)

                ws.send(
                  JSON.stringify({
                    type: "request_interviewer_feedback",
                    interviewId: sessionId,
                    codeSnapshot: params.codeSnapshot ?? "",
                    meta: {
                      phase: params.meta?.phase,
                      elapsedSeconds:
                        typeof params.meta?.elapsedSeconds === "number"
                          ? params.meta.elapsedSeconds
                          : undefined,
                      company: params.meta?.company,
                      problemTitle: params.meta?.problemTitle,
                    },
                  })
                )
              }
            )

            return result
          },
        }
      : null,
  }
}

async function sendAudioChunk(params: {
  sessionId: string
  blob: Blob
  mode: TranscriptMode
  company?: string
  problemId?: string
  problemTitle?: string
  phase?: InterviewPhase
  onError: (message: string) => void
}): Promise<string | null> {
  const { sessionId, blob, mode, company, problemId, problemTitle, phase, onError } =
    params

  try {
    const token = await getCurrentIdToken()
    if (!token) {
      onError(
        "You’re not signed in. Return to setup and sign in, then start the interview again."
      )
      return null
    }

    const formData = new FormData()
    formData.append("audio", blob, "chunk.webm")
    formData.append("mode", mode)
    if (company) formData.append("company", company)
    if (problemId) formData.append("problemId", problemId)
    if (problemTitle) formData.append("problemTitle", problemTitle)
    if (phase) formData.append("phase", phase)

    const res = await fetch(`/api/interviews/${sessionId}/audio-chunk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const message =
        (data.error as string) ||
        "Failed to process audio. Your transcript may be incomplete."
      onError(message)
      return null
    }

    const data = (await res.json().catch(() => ({}))) as {
      text?: string
      sequence?: number | null
    }

    return typeof data.text === "string" ? data.text : null
  } catch {
    onError("Failed to send audio for transcription.")
    return null
  }
}

async function sendTranscriptChunk(params: {
  sessionId: string
  text: string
  mode: TranscriptMode
  company?: string
  problemId?: string
  problemTitle?: string
  phase?: InterviewPhase
  onError: (message: string) => void
}) {
  const { sessionId, text, mode, company, problemId, problemTitle, phase, onError } =
    params

  try {
    const token = await getCurrentIdToken()
    if (!token) {
      onError(
        "You’re not signed in. Return to setup and sign in, then start the interview again."
      )
      return
    }

    const res = await fetch(`/api/interviews/${sessionId}/transcript-chunk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        mode,
        company,
        problemId,
        problemTitle,
        phase,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const message =
        (data.error as string) || "Failed to save transcript chunk."
      onError(message)
    }
  } catch {
    onError("Failed to save transcript chunk.")
  }
}

