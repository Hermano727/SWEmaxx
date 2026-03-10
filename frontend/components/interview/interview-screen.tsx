"use client"

import { useState, useEffect, useRef } from "react"
import { Play, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Mic, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import InterviewNavbar from "./interview-navbar"
import CodeEditor from "./code-editor"

import { recordInterviewEnd } from "@/lib/firebase/firestore"
import { getCurrentIdToken } from "@/lib/firebase/auth"
import type {
  InterviewEvent,
  InterviewPhase,
  InterviewResult,
} from "@/lib/interview/types"
import { getCodeTemplate, SUPPORTED_EDITOR_LANGUAGES, DEFAULT_EDITOR_LANGUAGE } from "@/lib/constants/questions"
import type { QuestionBankItem, EditorLanguage } from "@/lib/constants/questions"
import { useContinuousTranscriptCapture } from "@/lib/interview/useContinuousTranscriptCapture"
import {
  type InterviewerUiMessage,
  useInterviewerOutput,
} from "@/lib/interview/useInterviewerOutput"

import { ProblemPanel } from "./ProblemPanel"
import { NotesPanel } from "./NotesPanel"
import { HintToast } from "./HintToast"
import { ExitConfirmDialog } from "./ExitConfirmDialog"

interface InterviewScreenProps {
  config: any
  onFinish: (results: any) => void
  onExit: () => void
}

const TAB_SPACES = "     " // 5 spaces

const LEFT_PANEL_MIN_WIDTH = 56
const LEFT_PANEL_MAX_WIDTH = 78
const LEFT_PANEL_DEFAULT_WIDTH = 68
const SCRATCHPAD_COLLAPSED_WIDTH_PX = 56

const MAX_HINTS_PER_INTERVIEW = 3
const MAX_ASK_QUESTIONS = 3

const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
}

function useTabInsert(
  value: string,
  setValue: (v: string) => void
) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return
    e.preventDefault()
    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = value.slice(0, start) + TAB_SPACES + value.slice(end)
    setValue(next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + TAB_SPACES.length
    })
  }
}

const defaultQuestion: QuestionBankItem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "easy",
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
  ],
  constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists."],
}

export default function InterviewScreen({ config, onFinish, onExit }: InterviewScreenProps) {
  const problem: QuestionBankItem = config?.problem ?? defaultQuestion
  const hints = problem.hints ?? []
  const initialCode = getCodeTemplate(problem.id, DEFAULT_EDITOR_LANGUAGE)
  const [timeRemaining, setTimeRemaining] = useState(45 * 60)
  const [code, setCode] = useState(initialCode)
  const [notes, setNotes] = useState("")
  const handleNotesTab = useTabInsert(notes, setNotes)
  const [notesCollapsed, setNotesCollapsed] = useState(false)
  const [problemCollapsed, setProblemCollapsed] = useState(false)
  const [language, setLanguage] = useState<EditorLanguage>(DEFAULT_EDITOR_LANGUAGE)
  const [revealedHintsCount, setRevealedHintsCount] = useState(0)
  const [hintPanelOpen, setHintPanelOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [timerVisible, setTimerVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(LEFT_PANEL_DEFAULT_WIDTH)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [interviewDocId, setInterviewDocId] = useState<string | null>(null)
  const [isFinishingInterview, setIsFinishingInterview] = useState(false)
  const [interviewErrorMessage, setInterviewErrorMessage] = useState<string | null>(null)

  type QuestionStatus = "pending" | "answered" | "error"
  type AskedQuestion = {
    id: string
    text: string
    answer?: string
    createdAt: string
    status: QuestionStatus
  }

  const [questions, setQuestions] = useState<AskedQuestion[]>([])
  const [askInput, setAskInput] = useState("")
  const [askLoadingId, setAskLoadingId] = useState<string | null>(null)
  const [interviewerLoading, setInterviewerLoading] = useState(false)
  const [interviewerError, setInterviewerError] = useState<string | null>(null)
  const lastInterviewerTickRef = useRef<number>(0)
  const autoTickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nonErrorQuestionsCount = questions.filter((q) => q.status !== "error").length
  const remainingQuestionCount = Math.max(0, MAX_ASK_QUESTIONS - nonErrorQuestionsCount)

  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("intro")
  const [isMicUserEnabled, setIsMicUserEnabled] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // If the parent provided an interviewDocId (from setup), use it so this
    // component can finish the same interview document.
    if (config?.interviewDocId) {
      setInterviewDocId(config.interviewDocId)
    }

    if (!config.timeLimit) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          void finalizeInterview("timeout")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [config.timeLimit])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newWidth >= LEFT_PANEL_MIN_WIDTH && newWidth <= LEFT_PANEL_MAX_WIDTH) {
        setLeftPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const handleLanguageChange = (next: EditorLanguage) => {
    setLanguage(next)
    setCode(getCodeTemplate(problem.id, next))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const sessionId: string | undefined =
    config?.sessionId ?? config?.interviewDocId ?? interviewDocId ?? undefined

  const interviewerMode: "silent" | "ask_box" | "active" = (() => {
    const raw =
      config?.interviewerMode ??
      config?.mode ??
      "silent"
    if (raw === "ask_box" || raw === "active") return raw
    return "silent"
  })()

  const {
    messages: interviewerMessages,
    pushMessage: pushInterviewerMessage,
  } = useInterviewerOutput({
    enableVoice: Boolean(config?.interviewerVoiceEnabled),
  })

  const micBaseEnabled =
    Boolean(sessionId) && currentPhase !== "wrapUp" && !isFinishingInterview

  const micEnabled = micBaseEnabled && isMicUserEnabled

  const {
    isSupported: micSupported,
    isRecording: micRecording,
    error: micError,
    voiceGateway,
  } = useContinuousTranscriptCapture({
    sessionId,
    enabled: micEnabled,
    mode: interviewerMode === "active" ? "active_interviewer_context" : "silent",
    company: config?.company,
    problemId: problem.id,
    problemTitle: problem.title,
    phase: currentPhase,
    isTyping,
  })
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName.toLowerCase()
      const isTypingField =
        tag === "input" || tag === "textarea" || target.isContentEditable

      // Monaco renders a textarea; treat that as typing too.
      const inMonaco =
        typeof (target as any).closest === "function" &&
        !!(target as any).closest(".monaco-editor")

      if (!isTypingField && !inMonaco) return

      setIsTyping(true)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null
        setIsTyping(false)
      }, 1200)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
    }
  }, [])


  const elapsedSeconds =
    config?.timeLimit && typeof config.timeLimit === "number"
      ? Math.max(0, config.timeLimit * 60 - timeRemaining)
      : null
  useEffect(() => {
    if (elapsedSeconds == null) return

    setCurrentPhase((prev) => {
      if (prev === "wrapUp") return prev
      if (elapsedSeconds < 60) {
        return prev
      }
      if (elapsedSeconds < 5 * 60) {
        return prev === "intro" ? "clarification" : prev
      }
      if (elapsedSeconds < 35 * 60) {
        if (prev === "intro" || prev === "clarification") {
          return "coding"
        }
        return prev
      }
      if (elapsedSeconds >= 35 * 60) {
        return prev === "coding" || prev === "design" ? "testing" : prev
      }
      return prev
    })
  }, [elapsedSeconds])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key !== "f" && e.key !== "F") return
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName.toLowerCase()
      const isTypingField =
        tag === "input" || tag === "textarea" || target.isContentEditable
      if (isTypingField) return
      setIsMicUserEnabled((prev) => !prev)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])


  const sendInterviewerTick = async (reason: "on_demand" | "auto") => {
    if (!sessionId || interviewerMode !== "active") return
    if (interviewerLoading) return

    try {
      setInterviewerLoading(true)
      setInterviewerError(null)

      // Prefer low-latency voice gateway if configured (WS transport).
      if (reason === "on_demand" && voiceGateway?.isConnected) {
        const msg = await voiceGateway.requestInterviewerFeedback({
          codeSnapshot: code,
          meta: {
            phase: currentPhase,
            elapsedSeconds,
            company: config?.company,
            problemTitle: problem.title,
          },
        })

        lastInterviewerTickRef.current = Date.now()

        if (msg) {
          pushInterviewerMessage({
            id: msg.id,
            kind: msg.kind,
            text: msg.text,
            replyToText: null,
          })
        }
        return
      }

      const token = await getCurrentIdToken()
      if (!token) {
        setInterviewerError(
          "You’re not signed in. Return to setup and sign in, then start the interview again."
        )
        return
      }

      const res = await fetch(`/api/interviews/${sessionId}/interviewer-tick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: interviewerMode,
          reason,
          codeSnapshot: code,
          meta: {
            company: config?.company,
            problemId: problem.id,
            problemTitle: problem.title,
            elapsedSeconds,
            phase: currentPhase,
          },
        }),
      })

      lastInterviewerTickRef.current = Date.now()

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const message =
          (data.error as string) ||
          "Interviewer could not respond at this time."
        setInterviewerError(message)
        return
      }

      const data = (await res.json()) as {
        message: InterviewerUiMessage | null
      }

      const message = data.message
      if (message) {
        pushInterviewerMessage(message)
      }
    } catch (e) {
      console.error("Failed to get interviewer response", e)
      setInterviewerError("Interviewer could not respond at this time.")
    } finally {
      setInterviewerLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionId || interviewerMode !== "active") {
      if (autoTickIntervalRef.current) {
        clearInterval(autoTickIntervalRef.current)
        autoTickIntervalRef.current = null
      }
      return
    }

    if (autoTickIntervalRef.current) return

    autoTickIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const last = lastInterviewerTickRef.current
      // Only attempt an auto tick every ~90s and only if we have elapsed time
      if (elapsedSeconds != null && elapsedSeconds > 0 && now - last > 90_000) {
        void sendInterviewerTick("auto")
      }
    }, 30_000)

    return () => {
      if (autoTickIntervalRef.current) {
        clearInterval(autoTickIntervalRef.current)
        autoTickIntervalRef.current = null
      }
    }
  }, [sessionId, interviewerMode, elapsedSeconds])

  const logInterviewEvent = async (event: Omit<InterviewEvent, "sessionId">) => {
    if (!sessionId) return
    try {
      await fetch(`/api/interviews/${sessionId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [
            {
              sessionId,
              ...event,
            },
          ],
        }),
      })
    } catch (e) {
      console.error("Failed to send interview event", e)
    }
  }

  const finalizeInterview = async (reason: "submit" | "timeout") => {
    if (!sessionId) {
      setInterviewErrorMessage("No interview session. Return to setup and start again.")
      return
    }
    setCurrentPhase("wrapUp")
    let scorecard: InterviewResult | null = null
    setIsFinishingInterview(true)
    setInterviewErrorMessage(null)
    try {
      const eventPayload: InterviewEvent = {
        sessionId,
        type: reason === "submit" ? "submit" : "timeout",
        phase: "wrapUp",
        timestamp: new Date().toISOString(),
        payload: { note: reason === "submit" ? "User pressed Submit Solution" : "Timer reached zero" },
      }
      const token = await getCurrentIdToken()
      if (!token) {
        setInterviewErrorMessage(
          "You’re not signed in. Return to setup and sign in, then start the interview again."
        )
        setIsFinishingInterview(false)
        return
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
      const res = await fetch(`/api/interviews/${sessionId}/finish`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          config,
          code,
          notes,
          events: [eventPayload],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        scorecard = data.scorecard as InterviewResult
      } else if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}))
        setInterviewErrorMessage((data.error as string) || "Unauthorized")
      }
    } catch (e: unknown) {
      console.error("Failed to generate interview scorecard", e)
      setInterviewErrorMessage(
        e instanceof Error ? e.message : "Failed to generate interview feedback"
      )
    }

    if (!scorecard) {
      scorecard = {
        rating: "Hire",
        score: 80,
        company: config?.company,
        strengths: [
          "Clearly stated at least one workable approach",
          "Reasoned about time/space complexity at a basic level",
        ],
        weaknesses: ["Could structure clarification and edge cases more explicitly before coding"],
        mistakes: [
          {
            time: "00:00",
            severity: "minor",
            phase: "clarification",
            category: "clarification",
            message: "Did not explicitly restate the problem and constraints at the beginning.",
          },
        ],
      }
    }

    try {
      if (interviewDocId) {
        await recordInterviewEnd(interviewDocId, scorecard, { notes, code })
        setInterviewDocId(null)
      }
    } catch (e: unknown) {
      console.error("Failed to record interview end:", e)
      setInterviewErrorMessage(
        e instanceof Error ? e.message : "Failed to save interview result"
      )
    } finally {
      setIsFinishingInterview(false)
    }

    const resultWithId: InterviewResult = {
      ...scorecard,
      id: sessionId,
    }
    onFinish(resultWithId)
  }

  async function handleSubmitInterview() {
    if (!sessionId) {
      setInterviewErrorMessage("No interview session. Return to setup and start again.")
      return
    }

    setIsFinishingInterview(true)
    setCurrentPhase("wrapUp")
    await logInterviewEvent({
      type: "submit",
      phase: "wrapUp",
      timestamp: new Date().toISOString(),
      payload: { note: "User pressed Submit Solution" },
    })

    await finalizeInterview("submit")
  }

  const handleUseHint = async () => {
    if (!config.hintsEnabled) return

    const maxHints = Math.min(MAX_HINTS_PER_INTERVIEW, hints.length)
    if (revealedHintsCount >= maxHints) return

    const nextIndex = revealedHintsCount
    const nextCount = revealedHintsCount + 1
    setRevealedHintsCount(nextCount)
    setHintPanelOpen(true)

    await logInterviewEvent({
      type: "hint",
      phase: "coding",
      timestamp: new Date().toISOString(),
      payload: {
        problemId: problem.id,
        hintIndex: nextIndex,
      },
    })
  }

  const remainingHintCount = Math.max(
    0,
    Math.min(MAX_HINTS_PER_INTERVIEW, hints.length) - revealedHintsCount
  )

  const handleAskSubmit = async () => {
    const question = askInput.trim()
    if (!question || !sessionId) return
    if (remainingQuestionCount <= 0) {
      setInterviewErrorMessage("You’ve reached the question limit for this interview.")
      return
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const createdAt = new Date().toISOString()
    const pendingQuestion: AskedQuestion = { id, text: question, createdAt, status: "pending" }

    setQuestions((prev) => [...prev, pendingQuestion])
    setAskInput("")
    setAskLoadingId(id)
    setInterviewErrorMessage(null)

    await logInterviewEvent({
      type: "question",
      phase: "clarification",
      timestamp: createdAt,
      payload: { question },
    })

    try {
      const token = await getCurrentIdToken()
      if (!token) {
        throw new Error(
          "You’re not signed in. Return to setup and sign in, then start the interview again."
        )
      }

      const res = await fetch(`/api/interviews/${sessionId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          config,
          code,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data.error as string) || "Failed to get interviewer answer.")
      }

      const data = (await res.json()) as { answer: string }
      const answer = data.answer

      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, answer, status: "answered" } : q))
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to get interviewer answer."
      setInterviewErrorMessage(message)
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: "error" } : q))
      )
    } finally {
      setAskLoadingId(null)
    }
  }

  const handlePause = () => {
    alert("Interview paused - Feature coming soon!")
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <InterviewNavbar
        timeRemaining={config.timeLimit ? timeRemaining : undefined}
        formatTime={formatTime}
        onPause={handlePause}
        onExit={() => setShowExitConfirm(true)}
        isVisible={timerVisible}
        onToggleVisibility={setTimerVisible}
      />

      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        <div
          className="flex flex-col border-r border-[#30363d] transition-[width] duration-200"
          style={{ width: rightPanelCollapsed ? "100%" : `${leftPanelWidth}%` }}
        >
          <ProblemPanel
            problem={problem}
            company={config?.company}
            collapsed={problemCollapsed}
            onToggleCollapsed={() => setProblemCollapsed((prev) => !prev)}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1d23] border-b border-[#30363d]">
              <span className="text-sm font-semibold text-white tracking-tight">Code Editor</span>
              <Select value={language} onValueChange={(value) => handleLanguageChange(value as EditorLanguage)}>
                <SelectTrigger className="w-[132px] h-8 border-[#30363d] bg-[#0d1117] text-[#c9d1d9] text-sm hover:bg-[#21262d]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_EDITOR_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 p-4 min-h-0">
              <CodeEditor language={language} value={code} onChange={setCode} />
            </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#1a1d23] border-t border-[#30363d]">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-[#30363d] bg-transparent text-[#c9d1d9] hover:bg-[#22262e] hover:text-white hover:border-[#3b3f4d]"
                  >
                    <Play className="mr-2 h-3.5 w-3.5" />
                    Run Code
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCode(getCodeTemplate(problem.id, language))}
                    className="h-8 border-[#30363d] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white hover:border-[#3b3f4d]"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reset
                  </Button>
                  {config.hintsEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseHint}
                    disabled={remainingHintCount <= 0}
                    className="h-8 border-[#30363d] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white hover:border-[#3b3f4d] disabled:opacity-50"
                  >
                    <Lightbulb className="mr-2 h-3.5 w-3.5 text-[#46a758]" />
                    {remainingHintCount > 0
                      ? `Hint (${remainingHintCount} left)`
                      : "No hints left"}
                  </Button>
                  )}
                </div>

                <Button
                  onClick={handleSubmitInterview}
                  disabled={isFinishingInterview}
                  className="h-8 bg-[#46a758] hover:bg-[#3d9350] active:bg-[#36834a] text-white font-medium text-sm disabled:opacity-70"
                >
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  {isFinishingInterview ? "Generating feedback…" : "Submit Solution"}
                </Button>
              </div>
            </div>
        </div>

        {!rightPanelCollapsed && (
          <div
            className="w-1 bg-[#30363d] hover:bg-[#46a758] cursor-col-resize transition-colors relative group"
            onMouseDown={() => setIsDragging(true)}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-[#46a758]/20" />
          </div>
        )}

        <div
          className="flex flex-col bg-[#0d1117] min-h-0 h-full"
          style={{
            width: rightPanelCollapsed
              ? `${SCRATCHPAD_COLLAPSED_WIDTH_PX}px`
              : `${100 - leftPanelWidth}%`,
          }}
        >
          {rightPanelCollapsed ? (
            <button
              onClick={() => setRightPanelCollapsed(false)}
              className="h-full bg-[#1a1d23] border-l border-[#30363d] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#22262e] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <div className="flex-1 flex flex-col min-h-0 border border-[#30363d] rounded-md overflow-hidden bg-[#1a1d23]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#1a1d23] border-b border-[#30363d]">
                  <h2 className="text-sm font-semibold text-white tracking-tight">Interview brain</h2>
                  <button
                    onClick={() => setRightPanelCollapsed(true)}
                    className="rounded-md p-2 text-[#8b949e] hover:text-white hover:bg-[#22262e] transition-colors"
                    title="Collapse panel"
                    aria-label="Collapse notes panel"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117]">
                  {/* Top: Ask interviewer */}
                  <div className="flex-1 min-h-0 p-4 pb-3 flex flex-col gap-3 overflow-y-auto">
                    <div className="rounded-md border border-[#30363d] bg-[#1a1d23] p-3 space-y-2">
                      <p className="text-xs text-[#8b949e] mb-2">
                        Ask short clarifying questions like you would with a real interviewer.{" "}
                        <span className="text-[#c9d1d9] font-medium">Up to 3 questions</span> per interview.
                      </p>
                      <Textarea
                        value={askInput}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setAskInput(e.target.value)
                        }
                        rows={3}
                        className="w-full bg-[#0d1117] border border-[#30363d] text-sm text-white resize-none rounded-md focus-visible:ring-2 focus-visible:ring-[#46a758] focus-visible:ring-offset-0 focus-visible:ring-offset-[#1a1d23] placeholder:text-[#6e7681]"
                        placeholder="Example: “Can I assume the array is sorted?”"
                      />
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-[#6e7681]">
                            {remainingQuestionCount} questions remaining
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled
                              className="h-8 w-8 border-[#30363d] text-[#6e7681] hover:text-[#c9d1d9] hover:bg-[#22262e]"
                              title="Use your mic to fill this box (coming soon)"
                            >
                              <Mic className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAskSubmit}
                              disabled={!askInput.trim() || !!askLoadingId || !sessionId}
                              className="h-8 bg-[#46a758] hover:bg-[#3d9350] active:bg-[#36834a] text-white text-xs px-3"
                            >
                              {askLoadingId ? "Asking…" : "Ask interviewer"}
                            </Button>
                          </div>
                        </div>
                        {interviewerMode === "active" && (
                          <div className="flex items-center justify-between gap-3 border-t border-[#30363d] pt-2 mt-1">
                            <span className="text-[11px] text-[#6e7681]">
                              Want a nudge? Let the AI interviewer briefly check in on your progress.
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!sessionId || interviewerLoading}
                              onClick={() => void sendInterviewerTick("on_demand")}
                              className="h-8 border-[#46a758] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white"
                            >
                              {interviewerLoading ? "Checking in…" : "Check in with interviewer"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 rounded-md border border-[#30363d] bg-[#0d1117] p-3 overflow-y-auto space-y-3 problem-scroll">
                      {questions.length === 0 ? (
                        <p className="text-xs text-[#6e7681]">
                          No questions yet. Use this space to clarify constraints, edge cases, or expectations.
                        </p>
                      ) : (
                        questions.map((q) => (
                          <div key={q.id} className="space-y-1">
                            <p className="text-xs font-medium text-[#e6edf3]">You</p>
                            <p className="text-xs text-[#c9d1d9]">{q.text}</p>
                            <p className="mt-1 text-[11px] font-medium text-[#8b949e]">
                              Interviewer
                            </p>
                            {q.status === "pending" && (
                              <p className="text-xs text-[#6e7681]">Thinking…</p>
                            )}
                            {q.status === "answered" && (
                              <p className="text-xs text-[#e6edf3] leading-relaxed">
                                {q.answer}
                              </p>
                            )}
                            {q.status === "error" && (
                              <p className="text-xs text-red-400">
                                Could not fetch an answer. Try again.
                              </p>
                            )}
                            <div className="h-px bg-[#30363d] mt-2" />
                          </div>
                        ))
                      )}
                    </div>

                    {interviewerMode === "active" && (
                      <div className="mt-3 rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#c9d1d9]">
                            Interviewer responses
                          </p>
                          {interviewerError && (
                            <span className="text-[11px] text-red-400 truncate max-w-[60%]">
                              {interviewerError}
                            </span>
                          )}
                        </div>
                        {interviewerMessages.length === 0 ? (
                          <p className="text-xs text-[#6e7681]">
                            No interviewer messages yet. Click{" "}
                            <span className="text-[#c9d1d9] font-medium">
                              Check in with interviewer
                            </span>{" "}
                            above to get a short prompt.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {interviewerMessages.map((m) => (
                              <div key={m.id} className="text-xs text-[#e6edf3] leading-relaxed space-y-0.5">
                                <span className="mr-1 text-[11px] uppercase tracking-wide text-[#8b949e]">
                                  {m.kind === "question"
                                    ? "Question"
                                    : m.kind === "hint"
                                      ? "Hint"
                                      : "Feedback"}
                                  :
                                </span>
                                {m.replyToText && (
                                  <div className="text-[11px] text-[#8b949e]">
                                    Replying to:{" "}
                                    <span className="italic text-[#c9d1d9]">
                                      “{m.replyToText}”
                                    </span>
                                  </div>
                                )}
                                <div>{m.text}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <NotesPanel
                    notes={notes}
                    notesCollapsed={notesCollapsed}
                    onToggleCollapsed={() => setNotesCollapsed((v) => !v)}
                    onChangeNotes={setNotes}
                    onNotesKeyDown={handleNotesTab}
                  />
                </div>

                {/* Footer aligned with left panel buttons */}
                <div className="px-4 py-2 bg-[#1a1d23] border-t border-[#30363d] flex items-center justify-between h-[56px]">
                  <span className="text-xs text-[#6e7681]">
                    Auto-saved ·{" "}
                    {micSupported ? (
                      isMicUserEnabled
                        ? micRecording
                          ? "Listening for voice notes (press F to mute mic)"
                          : "Mic ready (press F to mute mic)"
                        : "Mic off (press F to turn mic on)"
                    ) : (
                      "Voice capture unavailable"
                    )}
                  </span>
                  {(interviewErrorMessage || micError || interviewerError) && (
                    <span
                      className="text-xs text-red-400 truncate max-w-[60%]"
                      title={
                        interviewErrorMessage ?? micError ?? interviewerError ?? undefined
                      }
                    >
                      {interviewErrorMessage ?? micError ?? interviewerError}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <HintToast
        hintsEnabled={config.hintsEnabled}
        isOpen={hintPanelOpen}
        revealedHintsCount={revealedHintsCount}
        hints={hints}
        onClose={() => setHintPanelOpen(false)}
      />

      <ExitConfirmDialog
        open={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onExit={onExit}
      />
    </div>
  )
}
