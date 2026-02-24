"use client"

import React from "react"
import Image from "next/image"

const LOGO_MAP: Record<string, string> = {
  google: "/assets/logos/google.png",
  meta: "/assets/logos/meta.png",
  amazon: "/assets/logos/amazon.svg",
}

type Props = {
  company?: string
  size?: number
}

export default function CompanyBadge({ company, size = 40 }: Props) {
  const name = (company ?? "").toString().trim().toLowerCase()
  const src = name ? LOGO_MAP[name] : null
  const initial = name.length ? name.charAt(0).toUpperCase() : "?"

  if (src) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-card"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={company ?? "Company"}
          width={size}
          height={size}
          className="object-contain p-1"
        />
      </div>
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground"
    >
      {initial}
    </div>
  )
}
