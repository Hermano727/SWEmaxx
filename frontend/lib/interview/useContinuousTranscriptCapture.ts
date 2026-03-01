"use client"

import { useEffect, useRef, useState } from "react"
import { getCurrentIdToken } from "@/lib/firebase/auth"
import {
  TRANSCRIPT_MAX_BUFFER_CHARS,
  TRANSCRIPT_SILENCE_FLUSH_MS,
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
}

type UseContinuousTranscriptCaptureState = {
  isSupported: boolean
  isRecording: boolean
  error: string | null
  transcriptPreview: string
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
  const { sessionId, enabled, mode, company, problemId, problemTitle, phase } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptPreview, setTranscriptPreview] = useState("")

  const recognitionRef = useRef<any>(null)
  const shouldRestartRef = useRef(false)
  const bufferRef = useRef("")
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendParamsRef = useRef<SendParams | null>(null)

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

  return {
    isSupported,
    isRecording,
    error,
    transcriptPreview,
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

