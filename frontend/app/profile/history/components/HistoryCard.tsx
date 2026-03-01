"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react"
import CompanyBadge from "./CompanyBadge"
import MetaGrid from "./MetaGrid"
import type { InterviewResult } from "@/lib/interview/types"
import {
  formatMistakeTime,
  formatSeverity,
  formatPhaseOrCategory,
} from "@/lib/interview/formatMistake"
import { getCurrentIdToken } from "@/lib/firebase/auth"

export type HistoryItem = {
  id?: string
  startedAt?: any
  endedAt?: any
  durationSeconds?: number
  score?: number
  date?: string
  company?: string
  problem?: string
  result?: string | InterviewResult | Record<string, any>
  runtime?: string
  meta?: Record<string, any>
}

function formatDuration(seconds: number | undefined): string {
  if (seconds == null || seconds < 0) return ""
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

function isScorecardResult(r: unknown): r is InterviewResult {
  return (
    r != null &&
    typeof r === "object" &&
    "rating" in r &&
    Array.isArray((r as InterviewResult).strengths) &&
    Array.isArray((r as InterviewResult).weaknesses) &&
    Array.isArray((r as InterviewResult).mistakes)
  )
}

export default function HistoryCard({ item }: { item: HistoryItem }) {
  const [popupOpen, setPopupOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [transcriptChunks, setTranscriptChunks] = useState<
    { id: string; offsetSeconds: number | null; text: string }[]
  >([])
  const [interviewerMessages, setInterviewerMessages] = useState<
    {
      id: string
      role: "user" | "assistant"
      messageType: "question" | "hint" | "nudged_feedback"
      text: string
      offsetSeconds: number | null
    }[]
  >([])

  const displayDate =
    item.date ??
    (item.startedAt?.toDate
      ? item.startedAt.toDate().toLocaleString()
      : typeof item.startedAt === "string"
        ? item.startedAt
        : "")

  const resultObj = item.result
  const resultText =
    typeof resultObj === "string"
      ? resultObj
      : resultObj && typeof resultObj === "object"
        ? (resultObj as Record<string, any>).rating ?? (resultObj as Record<string, any>).outcome ?? ""
        : ""

  const scorecard = isScorecardResult(resultObj) ? resultObj : null

  const isPositive = resultText.includes("Strong Hire") || resultText === "Hire"

  const meta = item.meta ?? {}
  const isValidMeta =
    typeof meta === "object" && meta !== null && typeof meta.company === "string"

  const companyName = String(meta.company ?? item.company ?? "?").replace(
    /\b\w/g,
    (c) => c.toUpperCase()
  )
  const durationSeconds = item.durationSeconds
  const score = item.score
  const hasMetrics =
    durationSeconds != null || (score != null && score !== undefined)

  useEffect(() => {
    if (!popupOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopupOpen(false)
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [popupOpen])

  useEffect(() => {
    if (!popupOpen || !item.id) return

    let cancelled = false
    const loadTranscript = async () => {
      try {
        setTranscriptLoading(true)
        setTranscriptError(null)

        const token = await getCurrentIdToken()
        if (!token) {
          if (!cancelled) {
            setTranscriptError("Sign in again to view this transcript.")
          }
          return
        }

        const res = await fetch(`/api/interviews/${item.id}/transcript`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const message =
            (data.error as string) ||
            "Could not load transcript for this interview."
          if (!cancelled) {
            setTranscriptError(message)
          }
          return
        }

        const data = (await res.json()) as {
          chunks?: {
            id: string
            sequence: number
            text: string
            offsetSeconds: number | null
          }[]
          messages?: {
            id: string
            role: "user" | "assistant"
            messageType: "question" | "hint" | "nudged_feedback"
            text: string
            createdAt: string
            offsetSeconds: number | null
          }[]
        }

        if (!cancelled) {
          setTranscriptChunks(
            (data.chunks ?? [])
              .filter((c) => typeof c.text === "string" && c.text.trim() !== "")
              .map((c) => ({
                id: c.id,
                offsetSeconds: c.offsetSeconds,
                text: c.text.trim(),
              }))
          )

          setInterviewerMessages(
            (data.messages ?? []).filter(
              (m) =>
                m.role === "assistant" &&
                typeof m.text === "string" &&
                m.text.trim() !== ""
            )
          )
        }
      } catch (e) {
        if (!cancelled) {
          setTranscriptError("Failed to load transcript.")
        }
      } finally {
        if (!cancelled) {
          setTranscriptLoading(false)
        }
      }
    }

    void loadTranscript()

    return () => {
      cancelled = true
    }
  }, [popupOpen, item.id])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setPopupOpen(false)
    }
  }

  const getRatingColor = (rating: string) => {
    if (rating === "Strong Hire") return "text-primary"
    if (rating === "Hire") return "text-amber-600 dark:text-amber-500"
    return "text-destructive"
  }

  const getSeverityColor = (severity: string) => {
    if (severity === "critical") return "text-destructive"
    if (severity === "major") return "text-amber-600 dark:text-amber-500"
    return "text-muted-foreground"
  }

  const formatOffsetTime = (seconds: number | null): string => {
    if (seconds == null || Number.isNaN(seconds)) return "--:--"
    const s = Math.max(0, Math.round(seconds))
    const m = Math.floor(s / 60)
    const r = s % 60
    const mm = m.toString().padStart(2, "0")
    const rr = r.toString().padStart(2, "0")
    return `${mm}:${rr}`
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setPopupOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setPopupOpen(true)
          }
        }}
        className="cursor-pointer border-border bg-card transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="pt-6">
          {isValidMeta || item.company ? (
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <CompanyBadge company={String(meta.company ?? item.company)} size={44} />

                <div>
                  <h3 className="text-lg font-semibold text-foreground">{companyName}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{displayDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {hasMetrics && (
                  <div className="flex gap-6 text-sm">
                    {durationSeconds != null && (
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Duration
                        </div>
                        <div className="mt-0.5 font-medium tabular-nums text-foreground">
                          {formatDuration(durationSeconds)}
                        </div>
                      </div>
                    )}
                    {score != null && (
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Score
                        </div>
                        <div className="mt-0.5 font-medium tabular-nums text-primary">
                          {score}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {resultText ? (
                  <div
                    className={`text-sm font-medium ${isPositive ? "text-primary" : "text-destructive"}`}
                  >
                    {scorecard ? scorecard.rating : resultText}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Invalid interview record</div>
          )}
        </CardContent>
      </Card>

      {popupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby="history-dialog-title"
        >
          <div
            ref={panelRef}
            className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <CompanyBadge company={String(meta.company ?? item.company)} size={40} />
                <div>
                  <h2 id="history-dialog-title" className="text-lg font-semibold text-foreground">
                    {companyName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{displayDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPopupOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <MetaGrid meta={meta} />

              {scorecard && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xl font-semibold ${getRatingColor(scorecard.rating)}`}
                    >
                      {scorecard.rating}
                    </span>
                    {scorecard.score != null && (
                      <span className="text-muted-foreground">{scorecard.score}/100</span>
                    )}
                  </div>

                  {scorecard.strengths.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Strengths
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {scorecard.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scorecard.weaknesses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Areas for Improvement
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {scorecard.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scorecard.mistakes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Mistake Log ({scorecard.mistakes.length})
                      </h3>
                      <ul className="space-y-2">
                        {scorecard.mistakes.map((m, i) => (
                          <li
                            key={i}
                            className="text-sm p-3 rounded-lg bg-muted/50 border border-border space-y-1"
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="text-muted-foreground">
                                {formatMistakeTime(m.time)}
                              </span>
                              <span
                                className={`font-semibold ${getSeverityColor(m.severity)}`}
                              >
                                {formatSeverity(m.severity)}
                              </span>
                              {(m.phase ?? m.category) && (
                                <span className="text-muted-foreground">
                                  {[m.phase, m.category]
                                    .filter((s): s is string => Boolean(s))
                                    .map(formatPhaseOrCategory)
                                    .join(" · ")}
                                </span>
                              )}
                            </div>
                            <p className="text-foreground leading-relaxed">{m.message}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!scorecard && resultText && (
                <div className="pt-2 border-t border-border">
                  <span className={`font-medium ${isPositive ? "text-primary" : "text-destructive"}`}>
                    {resultText}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Transcript</span>
                    {transcriptLoading && (
                      <span className="text-xs text-muted-foreground">Loading…</span>
                    )}
                  </h3>
                  {transcriptError && (
                    <p className="text-xs text-destructive">{transcriptError}</p>
                  )}
                  {!transcriptError && !transcriptLoading && transcriptChunks.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No transcript available for this interview yet.
                    </p>
                  )}
                  {transcriptChunks.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 space-y-2 text-sm">
                      {transcriptChunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <span className="shrink-0 text-xs font-mono text-muted-foreground/80">
                            {formatOffsetTime(chunk.offsetSeconds)}
                          </span>
                          <p className="text-sm leading-relaxed text-foreground/90">
                            {chunk.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-3">
                  <h3 className="text-sm font-semibold text-foreground">Interviewer prompts</h3>
                  {interviewerMessages.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No interviewer prompts were recorded for this interview.
                    </p>
                  )}
                  {interviewerMessages.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 space-y-2 text-sm">
                      {interviewerMessages.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <span className="shrink-0 text-xs font-mono text-muted-foreground/80">
                            {formatOffsetTime(m.offsetSeconds)}
                          </span>
                          <div className="space-y-1">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                              {m.messageType === "question"
                                ? "Question"
                                : m.messageType === "hint"
                                  ? "Hint"
                                  : "Feedback"}
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {m.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
