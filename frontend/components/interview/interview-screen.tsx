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

import { auth } from "@/lib/firebase/clientApp"
import { recordInterviewStart, recordInterviewEnd } from "@/lib/firebase/firestore"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"


interface InterviewScreenProps {
  config: any
  onFinish: (results: any) => void
  onExit: () => void
}

export default function InterviewScreen({ config, onFinish, onExit }: InterviewScreenProps) {
  const [timeRemaining, setTimeRemaining] = useState(45 * 60)
  const [code, setCode] = useState(`function twoSum(nums, target) {
  // Your code here
}`)
  const [notes, setNotes] = useState("")
  const [problemCollapsed, setProblemCollapsed] = useState(false)
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false)
  const [language, setLanguage] = useState("javascript")
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [navbarVisible, setNavbarVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(60)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Firebase auth
  const [userId, setUserId] = useState<string | null>(null);
  const [interviewDocId, setInterviewDocId] = useState<string | null>(null);
  const [loading, setloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFinish = () => {
    // If we have an interview document, mark it finished in Firestore before
    // calling the UI finish handler.
    (async () => {
      if (interviewDocId) {
        try {
          await recordInterviewEnd(interviewDocId, {
            score: 85,
            summary: "Auto-saved finish",
          })
        } catch (e: any) {
          console.error("Failed to record interview end:", e)
        }
      }

      onFinish({
        rating: "Strong Hire",
        score: 85,
        strengths: [
          "Clearly stated assumptions before coding",
          "Discussed time/space complexity tradeoffs",
          "Handled edge cases systematically",
        ],
        weaknesses: [
          "Could have optimized the initial approach earlier",
          "Missed opportunity to discuss alternative data structures",
        ],
        mistakes: [
          { time: "12:34", severity: "minor", message: "Minor syntax error in loop condition" },
          { time: "23:15", severity: "major", message: "Didn't verify solution with example before submitting" },
        ],
      })
    })()
  }

  async function handleEnd() {
    if (!interviewDocId) {
      setError("No active interview to end");
      return;
    }
    setloading(true);
    try {
      await recordInterviewEnd(interviewDocId, { score: 100 });
      setInterviewDocId(null);
    } catch (e: any) {
      setError(e.message || "Failed to end interview");
    } finally {
      setloading(false);
    }

    onFinish({
      rating: "Strong Hire",
      score: 85,
      strengths: [
        "Clearly stated assumptions before coding",
        "Discussed time/space complexity tradeoffs",
        "Handled edge cases systematically",
      ],
      weaknesses: [
        "Could have optimized the initial approach earlier",
        "Missed opportunity to discuss alternative data structures",
      ],
      mistakes: [
        { time: "12:34", severity: "minor", message: "Minor syntax error in loop condition" },
        { time: "23:15", severity: "major", message: "Didn't verify solution with example before submitting" },
      ],
    })

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
            className="bg-[#0d1117] border border-[#30363d] rounded px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
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
          <div className={`${problemCollapsed ? "h-12" : "h-[40%]"} border-b border-[#30363d] transition-all`}>
            <div className="h-full flex flex-col">
              <button
                onClick={() => setProblemCollapsed(!problemCollapsed)}
                className="flex items-center justify-between px-6 py-3 bg-[#1a1d23] border-b border-[#30363d] text-white hover:bg-[#22262e]"
              >
                <span className="font-semibold">Problem: Two Sum</span>
                {problemCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>

              {!problemCollapsed && (
                <div className="flex-1 overflow-y-auto p-6 bg-[#0d1117]">
                  <div className="text-gray-300 space-y-4 leading-relaxed">
                    <p>
                      Given an array of integers <code className="bg-[#30363d] px-2 py-1 rounded">nums</code> and an
                      integer <code className="bg-[#30363d] px-2 py-1 rounded">target</code>, return indices of the two
                      numbers such that they add up to target.
                    </p>

                    <div>
                      <p className="font-semibold text-white mb-2">Example:</p>
                      <div className="bg-[#1a1d23] p-4 rounded border border-[#30363d] font-mono text-sm">
                        <div>Input: nums = [2,7,11,15], target = 9</div>
                        <div>Output: [0,1]</div>
                        <div className="text-gray-500 mt-2">Explanation: nums[0] + nums[1] = 2 + 7 = 9</div>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-white mb-2">Constraints:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-400">
                        <li>2 ≤ nums.length ≤ 10⁴</li>
                        <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                        <li>Only one valid answer exists</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-[#0d1117]">
            <div className="flex items-center justify-between px-6 py-3 bg-[#1a1d23] border-b border-[#30363d]">
              <span className="text-white font-semibold">Code Editor</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px] bg-[#0d1117] border-[#30363d] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d23] border-[#30363d]">
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 p-6">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-[#1a1d23] border-[#30363d] text-white font-mono resize-none"
                placeholder="Write your code here..."
              />
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-[#1a1d23] border-t border-[#30363d]">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-[#30363d] bg-transparent">
                  <Play className="mr-2 h-4 w-4" />
                  Run Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCode(`function twoSum(nums, target) {\n  // Your code here\n}`)}
                  className="border-[#30363d]"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                {config.hintsEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseHint}
                    disabled={hintsUsed >= 3}
                    className="border-[#30363d]"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Hint ({3 - hintsUsed} left)
                  </Button>
                )}
              </div>

              <Button onClick={handleEnd} className="bg-[#46a758] hover:bg-[#3d8f4a] text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Submit Solution
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
              <div className="h-24 bg-[#1a1d23] border-b border-[#30363d] flex items-center gap-4 px-6 relative">
                <button
                  onClick={() => setRightPanelCollapsed(true)}
                  className="absolute top-3 right-3 bg-[#0d1117] border border-[#30363d] rounded p-1 text-gray-400 hover:text-white transition-colors"
                  title="Collapse panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="w-12 h-12 rounded-full bg-[#30363d] flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="text-white font-semibold">AI Interviewer</div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Observing...
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#0d1117]">
                <div className="px-6 py-3 bg-[#1a1d23] border-b border-[#30363d]">
                  <span className="text-white font-semibold">Scratchpad</span>
                  <p className="text-xs text-gray-400 mt-1">Your notes (not graded)</p>
                </div>

                <div className="flex-1 p-6">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-full bg-[#1a1d23] border-[#30363d] text-white resize-none"
                    placeholder="Write your thoughts, draw diagrams, plan your approach..."
                  />
                </div>

                <div className="px-6 py-3 bg-[#1a1d23] border-t border-[#30363d] text-xs text-gray-500">
                  Auto-saved • Last updated just now
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#1a1d23] border-[#30363d] max-w-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <AlertCircle className="h-6 w-6 text-yellow-500 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Exit Interview?</h3>
                  <p className="text-gray-400">Your progress will not be saved. Are you sure you want to exit?</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowExitConfirm(false)} className="border-[#30363d]">
                  Continue Interview
                </Button>
                <Button onClick={onExit} variant="destructive">
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
