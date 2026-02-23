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
    <Card className="bg-[#242830] border-[#3b3f4d] hover:border-[#46a758]/60 transition-all">
      <CardContent className="pt-6">
        {isValidMeta ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <CompanyBadge company={String(meta.company)} />

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      {String(meta.company).replace(/\b\w/g, c => c.toUpperCase())}
                    </h3>
                    <span className="text-[#9ca3af]">•</span>
                    <span className="text-[#9ca3af]">{displayDate}</span>
                  </div>

                  <div className="text-sm text-[#9ca3af]">Started at: {displayDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-[#9ca3af]">Runtime</div>
                  <div className="text-[#fbbf24] font-bold">{item.runtime ?? "—"}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-[#9ca3af]">Score</div>
                  <div className="text-[#46a758] font-bold">
                    {typeof item.score !== "undefined" ? `${item.score}%` : "—"}
                  </div>
                </div>

                <button
                  aria-expanded={open}
                  onClick={() => setOpen(v => !v)}
                  className="flex items-center justify-center p-2 rounded hover:bg-white/2 transition-colors"
                  title={open ? "Collapse details" : "Show details"}
                >
                  <ChevronDown
                    className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 ${
                      open ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <CheckCircle2 className="h-6 w-6 text-[#46a758]" />
                  ) : (
                    <XCircle className="h-6 w-6 text-[#e5484d]" />
                  )}
                  <span className={isPositive ? "text-[#46a758]" : "text-[#e5484d]"}>{resultText || "Pending"}</span>
                </div>
              </div>
            </div>

            <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${open ? 'max-h-[720px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <MetaGrid meta={meta} />
            </div>
          </>
        ) : (
          <div className="text-[#9ca3af]">Invalid interview record</div>
        )}
      </CardContent>
    </Card>
  )
}
