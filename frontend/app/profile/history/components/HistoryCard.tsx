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
            </div>
          </div>
        </div>
      )}
    </>
  )
}
