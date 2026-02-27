"use client"

import { useEffect, useRef, useState } from "react"
import { getCurrentIdToken } from "@/lib/firebase/auth"
import type { TranscriptMode } from "@/lib/db/postgres"

type UseContinuousTranscriptCaptureOptions = {
  sessionId?: string
  enabled: boolean
  mode: TranscriptMode
  company?: string
  problemId?: string
  problemTitle?: string
}

type UseContinuousTranscriptCaptureState = {
  isSupported: boolean
  isRecording: boolean
  error: string | null
  transcriptPreview: string
}

// Lightweight wrapper over the Web Speech API (where available).
// This hook continuously listens while `enabled` is true and sends
// finalized transcript chunks to the transcript-chunk API.
export function useContinuousTranscriptCapture(
  options: UseContinuousTranscriptCaptureOptions
): UseContinuousTranscriptCaptureState {
  const { sessionId, enabled, mode, company, problemId, problemTitle } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptPreview, setTranscriptPreview] = useState("")

  const recognitionRef = useRef<any>(null)
  const shouldRestartRef = useRef(false)

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

    const recognition = new SpeechRecognitionCtor() as any
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let finalText = ""
      let interimText = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
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

        if (sessionId) {
          void sendTranscriptChunk({
            sessionId,
            text: chunk,
            mode,
            company,
            problemId,
            problemTitle,
            onError: (message) => setError(message),
          })
        }
      }
    }

    recognition.onerror = (event: any) => {
      const message = (event && event.error) || "Speech recognition error"
      console.error("Speech recognition error", message)
      setError(message)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (shouldRestartRef.current && enabled && sessionId) {
        try {
          recognition.start()
          setIsRecording(true)
        } catch (e) {
          console.error("Failed to restart speech recognition", e)
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      shouldRestartRef.current = false
      try {
        recognition.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [sessionId, enabled, mode, company, problemId, problemTitle])

  useEffect(() => {
    if (!isSupported || !recognitionRef.current) return

    if (enabled && sessionId && !isRecording) {
      try {
        shouldRestartRef.current = true
        recognitionRef.current.start()
        setIsRecording(true)
        setError(null)
      } catch (e) {
        console.error("Failed to start speech recognition", e)
        setError("Failed to start microphone. Check browser permissions.")
      }
    } else if ((!enabled || !sessionId) && isRecording) {
      shouldRestartRef.current = false
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
  onError: (message: string) => void
}) {
  const { sessionId, text, mode, company, problemId, problemTitle, onError } =
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
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const message =
        (data.error as string) || "Failed to save transcript chunk."
      onError(message)
    }
  } catch (e) {
    console.error("Failed to send transcript chunk", e)
    onError("Failed to save transcript chunk.")
  }
}

