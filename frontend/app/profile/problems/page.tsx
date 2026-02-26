"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { subscribeUserHistory } from "@/lib/firebase/firestore"
import {
  QUESTION_BANK,
  capitalizeDifficulty,
  type QuestionBankItem,
  type Difficulty,
} from "@/lib/constants/questions"
import type { InterviewResult } from "@/lib/interview/types"
import { CheckCircle2, AlertTriangle, AlertCircle, X, ArrowLeft } from "lucide-react"
import CompanyBadge from "../history/components/CompanyBadge"

type ProblemStats = {
  attempts: number
  status: "solved" | "attempted" | "unsolved"
  bestRating: InterviewResult["rating"] | null
}

type HistoryItem = Record<string, any>

function deriveProblemStats(history: HistoryItem[]): Map<string, ProblemStats> {
  const byId = new Map<string, { attempts: number; ratings: InterviewResult["rating"][] }>()

  for (const item of history) {
    const problemId = item.meta?.problemId as string | undefined
    if (!problemId) continue

    const current = byId.get(problemId) ?? { attempts: 0, ratings: [] }
    current.attempts += 1

    const result = item.result
    const rating =
      result && typeof result === "object" && "rating" in result
        ? (result.rating as InterviewResult["rating"])
        : null
    if (rating) current.ratings.push(rating)
    byId.set(problemId, current)
  }

  const out = new Map<string, ProblemStats>()
  for (const [id, { attempts, ratings }] of byId) {
    const solved = ratings.some((r) => r === "Strong Hire" || r === "Hire")
    const status: ProblemStats["status"] =
      solved ? "solved" : attempts > 0 ? "attempted" : "unsolved"
    const bestRating =
      ratings.includes("Strong Hire")
        ? "Strong Hire"
        : ratings.includes("Hire")
          ? "Hire"
          : ratings.length > 0
            ? "No Hire"
            : null
    out.set(id, { attempts, status, bestRating })
  }
  return out
}

function getAttemptsForProblem(history: HistoryItem[], problemId: string): HistoryItem[] {
  return history
    .filter((item) => item.meta?.problemId === problemId)
    .sort((a, b) => {
      const aTime = a.startedAt?.toDate?.()?.getTime?.() ?? (typeof a.startedAt === "string" ? new Date(a.startedAt).getTime() : 0)
      const bTime = b.startedAt?.toDate?.()?.getTime?.() ?? (typeof b.startedAt === "string" ? new Date(b.startedAt).getTime() : 0)
      return bTime - aTime
    })
}

function formatAttemptDate(item: HistoryItem): string {
  const started = item.startedAt
  if (started?.toDate) return started.toDate().toLocaleString()
  if (typeof started === "string") return new Date(started).toLocaleString()
  return "—"
}

function formatDuration(seconds: number | undefined): string {
  if (seconds == null || seconds < 0) return ""
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

function ProblemRow({
  problem,
  stats,
  onOpenAttempts,
}: {
  problem: QuestionBankItem
  stats: ProblemStats | undefined
  onOpenAttempts: () => void
}) {
  const attempts = stats?.attempts ?? 0
  const status = stats?.status ?? "unsolved"
  const difficultyLabel = capitalizeDifficulty(problem.difficulty)

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpenAttempts}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpenAttempts()
        }
      }}
      className="cursor-pointer border-border bg-card transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">{problem.title}</h3>
            <p className="text-sm text-muted-foreground">
              {attempts} {attempts === 1 ? "attempt" : "attempts"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "rounded px-3 py-1 text-sm font-medium",
                problem.difficulty === "easy" && "bg-primary/20 text-primary",
                problem.difficulty === "medium" && "bg-chart-4/20 text-chart-4",
                problem.difficulty === "hard" && "bg-destructive/20 text-destructive"
              )}
            >
              {difficultyLabel}
            </span>
            <span className="text-sm text-muted-foreground">
              {status === "solved" ? "Solved" : status === "attempted" ? "Attempted" : "Unsolved"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProblemsPage() {
  const { user, loading: authLoading, signIn } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<QuestionBankItem | null>(null)
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedAttempt, setSelectedAttempt] = useState<HistoryItem | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    if (user?.uid) {
      unsub = subscribeUserHistory(user.uid, (items) => {
        setHistory(items)
      })
    } else {
      setHistory([])
    }
    return () => {
      if (unsub) unsub()
    }
  }, [user?.uid])

  const problemStats = useMemo(() => deriveProblemStats(history), [history])

  const attemptsForSelected =
    selectedProblem ? getAttemptsForProblem(history, selectedProblem.id) : []

  const openAttempts = (problem: QuestionBankItem) => {
    setSelectedProblem(problem)
    setView("list")
    setSelectedAttempt(null)
    setModalOpen(true)
  }

  const openAttemptDetail = (attempt: HistoryItem) => {
    setSelectedAttempt(attempt)
    setView("detail")
  }

  const backToList = () => {
    setView("list")
    setSelectedAttempt(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedProblem(null)
    setView("list")
    setSelectedAttempt(null)
  }

  useEffect(() => {
    if (!modalOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "detail") backToList()
        else closeModal()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [modalOpen, view])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      closeModal()
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">My problems</h1>
          </header>
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="mb-4">Sign in to see problems you’ve practiced in interviews.</p>
              <Button onClick={signIn} className="bg-primary text-primary-foreground hover:opacity-90">
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">My problems</h1>
          </header>
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">My problems</h1>
            <p className="mt-1 text-muted-foreground">
              Click a problem to see all attempts. Click an attempt to view notes and feedback.
            </p>
          </header>

          <div className="space-y-4">
            {QUESTION_BANK.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                stats={problemStats.get(problem.id)}
                onOpenAttempts={() => openAttempts(problem)}
              />
            ))}
          </div>
        </div>
      </main>

      {modalOpen && selectedProblem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby="problems-modal-title"
        >
          <div
            ref={panelRef}
            className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                {view === "detail" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={backToList}
                    className="shrink-0"
                    aria-label="Back to attempts"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 id="problems-modal-title" className="text-lg font-semibold text-foreground">
                  {view === "list"
                    ? `Attempts for ${selectedProblem.title}`
                    : selectedAttempt
                      ? formatAttemptDate(selectedAttempt)
                      : selectedProblem.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {view === "list" && (
                <div className="space-y-2">
                  {attemptsForSelected.length === 0 ? (
                    <p className="text-muted-foreground">No attempts yet for this problem.</p>
                  ) : (
                    attemptsForSelected.map((item, i) => {
                      const result = item.result
                      const rating =
                        result && typeof result === "object" && "rating" in result
                          ? (result.rating as string)
                          : null
                      const company = String(item.meta?.company ?? item.company ?? "?").replace(
                        /\b\w/g,
                        (c) => c.toUpperCase()
                      )
                      return (
                        <button
                          key={item.id ?? i}
                          type="button"
                          onClick={() => openAttemptDetail(item)}
                          className="w-full text-left rounded-lg border border-border bg-muted/30 hover:bg-muted/50 p-4 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <CompanyBadge company={item.meta?.company ?? item.company} size={32} />
                              <div>
                                <p className="font-medium text-foreground">{company}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatAttemptDate(item)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.score != null && (
                                <span className="text-sm tabular-nums text-muted-foreground">
                                  {item.score}%
                                </span>
                              )}
                              {rating && (
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    (rating === "Strong Hire" || rating === "Hire") && "text-primary",
                                    rating === "No Hire" && "text-destructive"
                                  )}
                                >
                                  {rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}

              {view === "detail" && selectedAttempt && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium text-foreground">
                      {String(selectedAttempt.meta?.company ?? selectedAttempt.company ?? "?").replace(
                        /\b\w/g,
                        (c) => c.toUpperCase()
                      )}
                    </span>
                    {selectedAttempt.result?.rating && (
                      <span
                        className={cn(
                          "font-medium",
                          (selectedAttempt.result.rating === "Strong Hire" ||
                            selectedAttempt.result.rating === "Hire") && "text-primary",
                          selectedAttempt.result.rating === "No Hire" && "text-destructive"
                        )}
                      >
                        {selectedAttempt.result.rating}
                      </span>
                    )}
                    {selectedAttempt.score != null && (
                      <span className="text-muted-foreground">{selectedAttempt.score}%</span>
                    )}
                    {selectedAttempt.durationSeconds != null && (
                      <span className="text-muted-foreground">
                        {formatDuration(selectedAttempt.durationSeconds)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Notes from this session</h3>
                    {selectedAttempt.notes ? (
                      <pre className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground whitespace-pre-wrap font-sans">
                        {selectedAttempt.notes}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No notes saved for this session.
                      </p>
                    )}
                  </div>

                  {selectedAttempt.result &&
                    typeof selectedAttempt.result === "object" &&
                    "strengths" in selectedAttempt.result && (
                      <div className="space-y-4 pt-2 border-t border-border">
                        {selectedAttempt.result.strengths?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              Strengths
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {selectedAttempt.result.strengths.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedAttempt.result.weaknesses?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              Areas for Improvement
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {selectedAttempt.result.weaknesses.map((w: string, i: number) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedAttempt.result.mistakes?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              Mistake Log
                            </h3>
                            <ul className="space-y-2">
                              {selectedAttempt.result.mistakes.map((m: any, i: number) => (
                                <li
                                  key={i}
                                  className="text-sm p-3 rounded-lg bg-muted/50 border border-border"
                                >
                                  <p className="text-foreground">{m.message}</p>
                                  {(m.phase ?? m.category) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {[m.phase, m.category].filter(Boolean).join(" · ")}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
