"use client"

import React from "react"

type Meta = {
  timeLimit?: boolean
  difficulty?: string
  company?: string
  liveFeedback?: boolean
  hintsEnabled?: boolean
  mode?: string
  startedAt?: any
  [k: string]: any
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
          <div className="mt-1 font-medium text-foreground">{meta.difficulty ?? ""}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Mode</div>
          <div className="mt-1 font-medium text-foreground">{meta.mode ?? ""}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Live feedback</div>
          <div className="mt-1 font-medium text-foreground">{meta.liveFeedback ? "On" : "Off"}</div>
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Hints enabled</div>
          <div className="mt-1 font-medium text-foreground">{meta.hintsEnabled ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  )
}
