"use client"

import { useState, useEffect, useRef } from "react"
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Mic,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import InterviewNavbar from "./interview-navbar"
import CodeEditor from "./code-editor"

import { recordInterviewEnd } from "@/lib/firebase/firestore"
import { getCurrentIdToken } from "@/lib/firebase/auth"
import type { InterviewResult, InterviewEvent } from "@/lib/interview/types"
import { getCodeTemplate, SUPPORTED_EDITOR_LANGUAGES, DEFAULT_EDITOR_LANGUAGE } from "@/lib/constants/questions"
import type { QuestionBankItem, EditorLanguage } from "@/lib/constants/questions"
import { companyAllowsExamples } from "@/lib/constants/companies"
import { useContinuousTranscriptCapture } from "@/lib/interview/useContinuousTranscriptCapture"

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
  const showExamples = companyAllowsExamples(config?.company)
  const initialCode = getCodeTemplate(problem.id, DEFAULT_EDITOR_LANGUAGE)
  const [timeRemaining, setTimeRemaining] = useState(45 * 60)
  const [code, setCode] = useState(initialCode)
  const [notes, setNotes] = useState("")
  const handleNotesTab = useTabInsert(notes, setNotes)
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          handleFinish()
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

  const sessionId: string | undefined = config?.sessionId ?? interviewDocId ?? undefined

  const interviewerMode: "silent" | "ask_box" | "active" =
    config?.interviewerMode === "ask_box" || config?.interviewerMode === "active"
      ? config.interviewerMode
      : "silent"

  const { isSupported: micSupported, isRecording: micRecording, error: micError } =
    useContinuousTranscriptCapture({
      sessionId,
      enabled: Boolean(sessionId),
      mode:
        interviewerMode === "active"
          ? "active_interviewer_context"
          : "silent",
      company: config?.company,
      problemId: problem.id,
      problemTitle: problem.title,
    })

  const sendEvent = async (event: Omit<InterviewEvent, "sessionId">) => {
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
      setError("No interview session. Return to setup and start again.")
      return
    }
    let scorecard: InterviewResult | null = null
    setLoading(true)
    setError(null)
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
        setError("You’re not signed in. Return to setup and sign in, then start the interview again.")
        setLoading(false)
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
        setError((data.error as string) || "Unauthorized")
      }
    } catch (e: unknown) {
      console.error("Failed to generate interview scorecard", e)
      setError(e instanceof Error ? e.message : "Failed to generate interview feedback")
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
      setError(e instanceof Error ? e.message : "Failed to save interview result")
    } finally {
      setLoading(false)
    }

    onFinish(scorecard)
  }

  const handleFinish = () => {
    (async () => {
      await finalizeInterview("timeout")
    })()
  }

  async function handleEnd() {
    await sendEvent({
      type: "submit",
      phase: "wrapUp",
      timestamp: new Date().toISOString(),
      payload: { note: "User pressed Submit Solution" },
    })

    await finalizeInterview("submit")
  }

  const handleUseHint = async () => {
    if (!config.hintsEnabled) return

    const maxHints = Math.min(3, hints.length)
    if (revealedHintsCount >= maxHints) return

    const nextIndex = revealedHintsCount
    const nextCount = revealedHintsCount + 1
    setRevealedHintsCount(nextCount)
    setHintPanelOpen(true)

    await sendEvent({
      type: "hint",
      phase: "coding",
      timestamp: new Date().toISOString(),
      payload: {
        problemId: problem.id,
        hintIndex: nextIndex,
      },
    })
  }

  const remainingHints = Math.max(0, Math.min(3, hints.length) - revealedHintsCount)

  const handleAskSubmit = async () => {
    const question = askInput.trim()
    if (!question || !sessionId) return
    if (questions.filter((q) => q.status !== "error").length >= 3) {
      setError("You’ve reached the question limit for this interview.")
      return
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const createdAt = new Date().toISOString()
    const pendingQuestion: AskedQuestion = { id, text: question, createdAt, status: "pending" }

    setQuestions((prev) => [...prev, pendingQuestion])
    setAskInput("")
    setAskLoadingId(id)
    setError(null)

    await sendEvent({
      type: "question",
      phase: "clarification",
      timestamp: createdAt,
      payload: { question },
    })

    try {
      const token = await getCurrentIdToken()
      if (!token) {
        throw new Error("You’re not signed in. Return to setup and sign in, then start the interview again.")
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
      setError(message)
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
          <div className={`${problemCollapsed ? "h-12" : "min-h-[36%] max-h-[40%]"} border-b border-[#30363d] transition-all duration-200 flex flex-col`}>
            <button
              onClick={() => setProblemCollapsed(!problemCollapsed)}
              className="flex items-center justify-between px-4 py-3 bg-[#1a1d23] border-b border-[#30363d] text-left text-white hover:bg-[#22262e] active:bg-[#242830] transition-colors rounded-none"
              aria-expanded={!problemCollapsed}
            >
              <span className="text-sm font-semibold tracking-tight">Problem: {problem.title}</span>
              {problemCollapsed ? <ChevronDown className="h-4 w-4 shrink-0 text-[#8b949e]" /> : <ChevronUp className="h-4 w-4 shrink-0 text-[#8b949e]" />}
            </button>

            {!problemCollapsed && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#0d1117] min-h-0 problem-scroll">
                <div className="text-[#e6edf3] space-y-4 text-sm leading-relaxed">
                  <p>{problem.description}</p>

                  {showExamples && problem.examples.length > 0 && (
                    <div>
                      <p className="font-medium text-white text-[13px] mb-2">Example{problem.examples.length > 1 ? "s" : ""}</p>
                      <div className="space-y-3">
                        {problem.examples.map((ex, i) => (
                          <div key={i} className="bg-[#1a1d23] p-4 rounded-md border border-[#30363d] font-mono text-[13px] text-[#e6edf3]">
                            <div>Input: {ex.input}</div>
                            <div>Output: {ex.output}</div>
                            {ex.explanation && <div className="text-[#8b949e] mt-2">Explanation: {ex.explanation}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-white text-[13px] mb-2">Constraints</p>
                    <ul className="list-disc list-inside space-y-1 text-[#8b949e] text-[13px]">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    disabled={remainingHints <= 0}
                    className="h-8 border-[#30363d] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white hover:border-[#3b3f4d] disabled:opacity-50"
                  >
                    <Lightbulb className="mr-2 h-3.5 w-3.5 text-[#46a758]" />
                    {remainingHints > 0 ? `Hint (${remainingHints} left)` : "No hints left"}
                  </Button>
                  )}
                </div>

                <Button
                  onClick={handleEnd}
                  disabled={loading}
                  className="h-8 bg-[#46a758] hover:bg-[#3d9350] active:bg-[#36834a] text-white font-medium text-sm disabled:opacity-70"
                >
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  {loading ? "Generating feedback…" : "Submit Solution"}
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
          className={`flex flex-col bg-[#0d1117] ${rightPanelCollapsed ? "w-12" : ""}`}
          style={{ width: rightPanelCollapsed ? `${SCRATCHPAD_COLLAPSED_WIDTH_PX}px` : `${100 - leftPanelWidth}%` }}
        >
          {rightPanelCollapsed ? (
            <button
              onClick={() => setRightPanelCollapsed(false)}
              className="h-full bg-[#1a1d23] border-l border-[#30363d] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#22262e] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <>
              <div className="flex flex-col bg-[#0d1117] min-h-0">
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

                <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117]">
                  {/* Top: Ask interviewer */}
                  <div className="flex-[3] min-h-0 p-4 pb-2 flex flex-col gap-3">
                    <div className="rounded-md border border-[#30363d] bg-[#1a1d23] p-3">
                      <p className="text-xs text-[#8b949e] mb-2">
                        Ask short clarifying questions like you would with a real interviewer.{" "}
                        <span className="text-[#c9d1d9] font-medium">Up to 3 questions</span> per interview.
                      </p>
                      <Textarea
                        value={askInput}
                        onChange={(e) => setAskInput(e.target.value)}
                        rows={3}
                        className="w-full bg-[#0d1117] border border-[#30363d] text-sm text-white resize-none rounded-md focus-visible:ring-2 focus-visible:ring-[#46a758] focus-visible:ring-offset-0 focus-visible:ring-offset-[#1a1d23] placeholder:text-[#6e7681]"
                        placeholder="Example: “Can I assume the array is sorted?”"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-[#6e7681]">
                          {Math.max(0, 3 - questions.filter((q) => q.status !== "error").length)} questions remaining
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
                            <p className="mt-1 text-[11px] font-medium text-[#8b949e]">Interviewer</p>
                            {q.status === "pending" && (
                              <p className="text-xs text-[#6e7681]">Thinking…</p>
                            )}
                            {q.status === "answered" && (
                              <p className="text-xs text-[#e6edf3] leading-relaxed">{q.answer}</p>
                            )}
                            {q.status === "error" && (
                              <p className="text-xs text-red-400">Could not fetch an answer. Try again.</p>
                            )}
                            <div className="h-px bg-[#30363d] mt-2" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bottom: Notes */}
                  <div className="flex-[2] min-h-0 border-t border-[#30363d] bg-[#0d1117] flex flex-col">
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-xs font-medium text-[#c9d1d9] mb-2">Notes</p>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onKeyDown={handleNotesTab}
                        className="w-full h-28 bg-[#1a1d23] border border-[#30363d] text-white resize-none rounded-md focus-visible:ring-2 focus-visible:ring-[#46a758] focus-visible:ring-offset-0 focus-visible:ring-offset-[#0d1117] placeholder:text-[#6e7681]"
                        placeholder="Write your thoughts, draw diagrams, plan your approach..."
                      />
                    </div>
                    <div className="px-4 py-2 bg-[#1a1d23] border-t border-[#30363d] flex items-center justify-between gap-2">
                      <span className="text-xs text-[#6e7681]">
                        Auto-saved ·{" "}
                        {micSupported
                          ? micRecording
                            ? "Listening for voice notes"
                            : "Mic ready"
                          : "Voice capture unavailable"}
                      </span>
                      {(error || micError) && (
                        <span
                          className="text-xs text-red-400 truncate max-w-[60%]"
                          title={error ?? micError ?? undefined}
                        >
                          {error ?? micError}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {config.hintsEnabled && hintPanelOpen && revealedHintsCount > 0 && hints.length > 0 && (
        <div className="fixed bottom-4 left-4 max-w-md z-40">
          <Card className="bg-[#1a1d23] border border-[#30363d] shadow-xl rounded-lg overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#46a758]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8b949e]">
                    Interview hint{revealedHintsCount > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => setHintPanelOpen(false)}
                  className="text-xs text-[#8b949e] hover:text-white hover:bg-[#22262e] rounded-md px-2 py-1 transition-colors"
                >
                  Hide
                </button>
              </div>

              <div className="space-y-2">
                {hints.slice(0, revealedHintsCount).map((hint, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2"
                  >
                    <p className="text-[11px] font-medium text-[#8b949e] mb-1">
                      Hint {index + 1}
                    </p>
                    <p className="text-sm text-[#e6edf3] leading-relaxed">{hint}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#1a1d23] border border-[#30363d] max-w-md rounded-lg shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">Exit interview?</h3>
                  <p className="text-sm text-[#8b949e]">Your progress will not be saved.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowExitConfirm(false)}
                  className="border-[#30363d] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white"
                >
                  Continue
                </Button>
                <Button onClick={onExit} variant="destructive" className="text-sm">
                  Exit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
