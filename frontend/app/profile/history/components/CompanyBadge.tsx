"use client"

import React from "react"

type Props = {
  company?: string
  size?: number
}

export default function CompanyBadge({ company, size = 48 }: Props) {
  const name = (company ?? "?").toString()
  const initial = name.length ? name.charAt(0).toUpperCase() : "?"

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[#1a1d23] flex items-center justify-center border border-[#3b3f4d] text-xl font-bold text-[#46a758]"
    >
      {initial}
    </div>
  )
}
