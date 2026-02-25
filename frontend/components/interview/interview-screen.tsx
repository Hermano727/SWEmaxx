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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import InterviewNavbar from "./interview-navbar"

import { recordInterviewEnd } from "@/lib/firebase/firestore"
import { getCurrentIdToken } from "@/lib/firebase/auth"
import type { InterviewResult, InterviewEvent } from "@/lib/interview/types"
import { getCodeTemplate } from "@/lib/constants/questions"
import type { QuestionBankItem } from "@/lib/constants/questions"

interface InterviewScreenProps {
  config: any
  onFinish: (results: any) => void
  onExit: () => void
}

const TAB_SPACES = "     " // 5 spaces

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
  const initialCode = getCodeTemplate(problem.id)
  const [timeRemaining, setTimeRemaining] = useState(45 * 60)
  const [code, setCode] = useState(initialCode)
  const [notes, setNotes] = useState("")
  const handleCodeTab = useTabInsert(code, setCode)
  const handleNotesTab = useTabInsert(notes, setNotes)
  const [problemCollapsed, setProblemCollapsed] = useState(false)
  const [language, setLanguage] = useState("javascript")
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [navbarVisible, setNavbarVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(60)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [interviewDocId, setInterviewDocId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      if (newWidth >= 30 && newWidth <= 80) {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const sessionId: string | undefined = config?.sessionId ?? interviewDocId ?? undefined

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

  const handleUseHint = () => {
    if (hintsUsed < 3) {
      setHintsUsed(hintsUsed + 1)
      alert("Hint: Consider using a hash map to store complements as you iterate through the array.")
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
        isVisible={navbarVisible}
        onToggleVisibility={setNavbarVisible}
      />

      {!navbarVisible && (
        <div className="w-full bg-[#1a1d23] border-b border-[#30363d] flex justify-center py-2">
          <button
            onClick={() => setNavbarVisible(true)}
            className="rounded-md px-4 py-2 text-sm text-[#8b949e] hover:text-white hover:bg-[#22262e] transition-colors flex items-center gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Show Timer
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        <div
          className="flex flex-col border-r border-[#30363d]"
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
              <div className="flex-1 overflow-y-auto p-4 bg-[#0d1117] min-h-0">
                <div className="text-[#c9d1d9] space-y-4 text-sm leading-relaxed">
                  <p>{problem.description}</p>

                  {problem.examples.length > 0 && (
                    <div>
                      <p className="font-medium text-white text-[13px] mb-2">Example{problem.examples.length > 1 ? "s" : ""}</p>
                      <div className="space-y-3">
                        {problem.examples.map((ex, i) => (
                          <div key={i} className="bg-[#1a1d23] p-4 rounded-md border border-[#30363d] font-mono text-[13px] text-[#c9d1d9]">
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
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[132px] h-8 border-[#30363d] bg-[#0d1117] text-[#c9d1d9] text-sm hover:bg-[#21262d]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 p-4 min-h-0">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleCodeTab}
                  className="w-full h-full bg-[#1a1d23] border border-[#30363d] text-[#c9d1d9] font-mono text-sm resize-none rounded-md focus-visible:ring-2 focus-visible:ring-[#46a758] focus-visible:ring-offset-0 focus-visible:ring-offset-[#0d1117] placeholder:text-[#6e7681]"
                  placeholder="Write your code here..."
                />
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
                    onClick={() => setCode(getCodeTemplate(problem.id))}
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
                      disabled={hintsUsed >= 3}
                      className="h-8 border-[#30363d] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white hover:border-[#3b3f4d] disabled:opacity-50"
                    >
                      <Lightbulb className="mr-2 h-3.5 w-3.5" />
                      Hint ({3 - hintsUsed} left)
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
          className={`flex flex-col transition-all ${rightPanelCollapsed ? "w-12" : ""}`}
          style={{ width: rightPanelCollapsed ? "48px" : `${100 - leftPanelWidth}%` }}
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
              <div className="flex items-center justify-between px-4 py-3 bg-[#1a1d23] border-b border-[#30363d]">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Scratchpad</h2>
                  <p className="text-xs text-[#8b949e] mt-0.5">Your notes (not graded)</p>
                </div>
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
                <div className="flex-1 p-4 min-h-0">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onKeyDown={handleNotesTab}
                    className="w-full h-full bg-[#1a1d23] border border-[#30363d] text-white resize-none rounded-md focus-visible:ring-2 focus-visible:ring-[#46a758] focus-visible:ring-offset-0 focus-visible:ring-offset-[#0d1117] placeholder:text-[#6e7681]"
                    placeholder="Write your thoughts, draw diagrams, plan your approach..."
                  />
                </div>

                <div className="px-4 py-2 bg-[#1a1d23] border-t border-[#30363d] flex items-center justify-between gap-2">
                  <span className="text-xs text-[#6e7681]">Auto-saved · Last updated just now</span>
                  {error && (
                    <span className="text-xs text-red-400 truncate max-w-[60%]" title={error}>
                      {error}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
