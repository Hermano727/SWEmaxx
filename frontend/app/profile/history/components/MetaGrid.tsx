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
    <div className="mt-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-md bg-[#0f1113] hover:bg-gradient-to-r hover:from-white/4 hover:to-white/2 transition-colors">
          <div className="text-sm text-[#8B949E]">Time Limit</div>
          <div className="text-white font-medium">{meta.timeLimit ? "Yes" : "No"}</div>
        </div>

        <div className="p-3 rounded-md bg-[#0f1113] hover:bg-gradient-to-r hover:from-white/4 hover:to-white/2 transition-colors">
          <div className="text-sm text-[#8B949E]">Difficulty</div>
          <div className="text-white font-medium">{meta.difficulty ?? "—"}</div>
        </div>

        <div className="p-3 rounded-md bg-[#0f1113] hover:bg-gradient-to-r hover:from-white/4 hover:to-white/2 transition-colors">
          <div className="text-sm text-[#8B949E]">Mode</div>
          <div className="text-white font-medium">{meta.mode ?? "—"}</div>
        </div>

        <div className="p-3 rounded-md bg-[#0f1113] hover:bg-gradient-to-r hover:from-white/4 hover:to-white/2 transition-colors">
          <div className="text-sm text-[#8B949E]">Live Feedback</div>
          <div className="text-white font-medium">{meta.liveFeedback ? "On" : "Off"}</div>
        </div>

        <div className="col-span-2 p-3 rounded-md bg-[#0f1113] hover:bg-gradient-to-r hover:from-white/4 hover:to-white/2 transition-colors">
          <div className="text-sm text-[#8B949E]">Hints Enabled</div>
          <div className="text-white font-medium">{meta.hintsEnabled ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  )
}
