"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"
import { ChevronDown } from "lucide-react"
import CompanyBadge from "./CompanyBadge"
import MetaGrid from "./MetaGrid"

export type HistoryItem = {
  id?: string
  startedAt?: any
  date?: string
  company?: string
  problem?: string
  result?: string | { outcome?: string } | Record<string, any>
  runtime?: string
  score?: number
  meta?: Record<string, any>
}

export default function HistoryCard({ item }: { item: HistoryItem }) {
  const [open, setOpen] = useState(false)
  // Normalize display date
  const displayDate = item.date ?? (item.startedAt?.toDate ? item.startedAt.toDate().toLocaleString() : typeof item.startedAt === "string" ? item.startedAt : "")

  // Normalize result text
  const resultText = typeof item.result === "string"
    ? item.result
    : item.result && typeof item.result === "object"
      ? item.result.outcome ?? JSON.stringify(item.result)
      : String(item.result ?? "")

  const isPositive = resultText.includes("Strong Hire") || resultText === "Hire"

  const meta = item.meta ?? {}
  const isValidMeta =
    typeof meta === "object" &&
    meta !== null &&
    typeof meta.timeLimit === "boolean" &&
    typeof meta.difficulty === "string" &&
    typeof meta.company === "string" &&
    typeof meta.liveFeedback === "boolean" &&
    typeof meta.hintsEnabled === "boolean" &&
    typeof meta.mode === "string"

  return (
    <Card className="bg-[#1E2127] border-[#30363D] hover:border-[#00FF41] transition-all">
      <CardContent className="pt-6">
        {isValidMeta ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <CompanyBadge company={String(meta.company)} />

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-[#00FF41]">{String(meta.company).replace(/\b\w/g, c => c.toUpperCase())}</h3>
                    <span className="text-[#8B949E]">•</span>
                    <span className="text-[#8B949E]">{displayDate}</span>
                  </div>

                  <div className="text-sm text-[#8B949E]">Started at: {displayDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-[#8B949E]">Runtime</div>
                  <div className="text-[#FFB86C] font-bold">{item.runtime ?? "—"}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-[#8B949E]">Score</div>
                  <div className="text-[#00FF41] font-bold">{typeof item.score !== 'undefined' ? `${item.score}%` : "—"}</div>
                </div>

                <button
                  aria-expanded={open}
                  onClick={() => setOpen(v => !v)}
                  className="flex items-center justify-center p-2 rounded hover:bg-white/2 transition-colors"
                  title={open ? "Collapse details" : "Show details"}
                >
                  <ChevronDown className={`h-4 w-4 text-[#8B949E] transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <CheckCircle2 className="h-6 w-6 text-[#00FF41]" />
                  ) : (
                    <XCircle className="h-6 w-6 text-[#EC4899]" />
                  )}
                  <span className={isPositive ? "text-[#00FF41]" : "text-[#EC4899]"}>
                    {resultText || "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${open ? 'max-h-[720px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <MetaGrid meta={meta} />
            </div>
          </>
        ) : (
          <div className="text-[#8B949E]">Invalid Interview</div>
        )}
      </CardContent>
    </Card>
  )
}
