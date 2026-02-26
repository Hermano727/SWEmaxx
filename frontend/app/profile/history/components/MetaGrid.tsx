"use client"

import React from "react"
import { capitalizeDifficulty } from "@/lib/constants/questions"

type Meta = {
  timeLimit?: boolean
  difficulty?: string
  drawnDifficulty?: string
  company?: string
  liveFeedback?: boolean
  hintsEnabled?: boolean
  mode?: string
  problemId?: string
  problemTitle?: string
  startedAt?: any
  [k: string]: any
}

function capitalize(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export default function MetaGrid({ meta }: { meta: Meta }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Time limit</div>
          <div className="mt-1 font-medium text-foreground">{meta.timeLimit ? "Yes" : "No"}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Difficulty</div>
          <div className="mt-1 font-medium text-foreground">
            {meta.difficulty === "random" && meta.drawnDifficulty
              ? `Random: ${capitalizeDifficulty(meta.drawnDifficulty)}`
              : capitalizeDifficulty(meta.difficulty ?? "")}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Mode</div>
          <div className="mt-1 font-medium text-foreground">{capitalize(meta.mode ?? "")}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Live feedback</div>
          <div className="mt-1 font-medium text-foreground">{meta.liveFeedback ? "On" : "Off"}</div>
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Hints enabled</div>
          <div className="mt-1 font-medium text-foreground">{meta.hintsEnabled ? "Yes" : "No"}</div>
        </div>
        {(meta.problemTitle || meta.problemId) && (
          <div className="col-span-2 rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Problem</div>
            <div className="mt-1 font-medium text-foreground">{meta.problemTitle ?? meta.problemId ?? "—"}</div>
          </div>
        )}
      </div>
    </div>
  )
}
