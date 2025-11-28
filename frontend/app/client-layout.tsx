"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { Navbar } from "@/components/common/navbar"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isInterviewPage = pathname === "/interview"

  return (
    <>
      {!isInterviewPage && <Navbar />}
      {children}
      <Analytics />
    </>
  )
}
