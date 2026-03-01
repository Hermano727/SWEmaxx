"use client"

import { useEffect, useRef, useState } from "react"
import type { InterviewerMessageKind } from "./interviewerAdapter"
import { speakInterviewerMessage } from "@/lib/voice/tts"

export type InterviewerUiMessage = {
  id: string
  text: string
  kind: InterviewerMessageKind
  replyToText?: string | null
}

type UseInterviewerOutputOptions = {
  enableVoice: boolean
}

type UseInterviewerOutputResult = {
  messages: InterviewerUiMessage[]
  pushMessage: (message: InterviewerUiMessage) => void
  clearMessages: () => void
}

export function useInterviewerOutput(
  options: UseInterviewerOutputOptions
): UseInterviewerOutputResult {
  const { enableVoice } = options
  const [messages, setMessages] = useState<InterviewerUiMessage[]>([])
  const lastSpokenIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enableVoice) return

    const latest = messages[messages.length - 1]
    if (!latest) return
    if (latest.id === lastSpokenIdRef.current) return

    lastSpokenIdRef.current = latest.id

    // Future TTS integration point: this currently does nothing,
    // but is wired so that adding real voice is a one-line change.
    void speakInterviewerMessage(latest.text)
  }, [messages, enableVoice])

  const pushMessage = (message: InterviewerUiMessage) => {
    setMessages((prev) => [...prev, message])
  }

  const clearMessages = () => {
    setMessages([])
    lastSpokenIdRef.current = null
  }

  return { messages, pushMessage, clearMessages }
}

