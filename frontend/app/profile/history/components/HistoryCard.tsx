"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import CompanyBadge from "./CompanyBadge"
import MetaGrid from "./MetaGrid"

export type HistoryItem = {
  id?: string
  startedAt?: any
  endedAt?: any
  durationSeconds?: number
  score?: number
  date?: string
  company?: string
  problem?: string
  result?: string | { outcome?: string } | Record<string, any>
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

export default function HistoryCard({ item }: { item: HistoryItem }) {
  const [open, setOpen] = useState(false)

  const displayDate = item.date ?? (item.startedAt?.toDate ? item.startedAt.toDate().toLocaleString() : typeof item.startedAt === "string" ? item.startedAt : "")

  const resultObj = item.result
  const resultText = typeof resultObj === "string"
    ? resultObj
    : resultObj && typeof resultObj === "object"
      ? (resultObj as Record<string, any>).outcome ?? ""
      : ""

  const isPositive = resultText.includes("Strong Hire") || resultText === "Hire"

  const meta = item.meta ?? {}
  const isValidMeta =
    typeof meta === "object" &&
    meta !== null &&
    typeof meta.company === "string"

  const companyName = String(meta.company ?? item.company ?? "?").replace(/\b\w/g, (c) => c.toUpperCase())
  const durationSeconds = item.durationSeconds
  const score = item.score
  const hasMetrics = durationSeconds != null || (score != null && score !== undefined)

  return (
    <Card className="border-border bg-card transition-colors hover:border-[var(--border-strong)]">
      <CardContent className="pt-6">
        {isValidMeta || item.company ? (
          <>
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
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Duration</div>
                        <div className="mt-0.5 font-medium tabular-nums text-foreground">
                          {formatDuration(durationSeconds)}
                        </div>
                      </div>
                    )}
                    {score != null && (
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
                        <div className="mt-0.5 font-medium tabular-nums text-primary">{score}%</div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={open ? "Collapse details" : "Show details"}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>

                {resultText ? (
                  <div className={`text-sm font-medium ${isPositive ? "text-primary" : "text-destructive"}`}>
                    {resultText}
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                open ? "max-h-[720px] opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <MetaGrid meta={meta} />
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">Invalid interview record</div>
        )}
      </CardContent>
    </Card>
  )
}
