"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { subscribeUserHistory } from "@/lib/firebase/firestore"
import { signInWithGoogle } from "@/lib/firebase/auth"

type HistoryItem = {
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

export default function HistoryPage() {
  const { user, loading: authLoading, signIn } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setHistory([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    let unsub: (() => void) | undefined

    try {
      unsub = subscribeUserHistory(user.uid, (items: HistoryItem[]) => {
        setHistory(items)
        setLoading(false)
      })
    } catch (err: any) {
      setError(err?.message ?? String(err))
      setLoading(false)
    }

    return () => {
      try {
        unsub && unsub()
      } catch (_) {}
    }
  }, [authLoading, user?.uid])

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{">"} Interview History</h1>

        {authLoading ? (
          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardContent className="p-8 text-center text-[#8B949E]">Checking sign-in status…</CardContent>
          </Card>
        ) : !user ? (
          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardContent className="p-8 text-center text-[#8B949E]">
              <div className="mb-4">Please sign in to view your interview history.</div>
              <div className="flex justify-center">
                <button
                  className="px-4 py-2 bg-[#00FF41] text-black rounded-md font-semibold"
                  onClick={() => signIn ? signIn() : signInWithGoogle()}
                >
                  Sign in with Google
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <Card className="bg-[#1E2127] border-[#30363D]">
                <CardContent className="p-8 text-center text-[#8B949E]">Loading history…</CardContent>
              </Card>
            ) : error ? (
              <Card className="bg-[#1E2127] border-[#30363D]">
                <CardContent className="p-8 text-center text-[#EC4899]">Error loading history: {error}</CardContent>
              </Card>
            ) : history.length === 0 ? (
              <Card className="bg-[#1E2127] border-[#30363D]">
                <CardContent className="p-8 text-center text-[#8B949E]">No interviews yet — start one to see it appear here.</CardContent>
              </Card>
            ) : (
              history.map((item, index) => {
                // Attempt to format a timestamp if present
                const displayDate = item.date ?? (item.startedAt?.toDate ? item.startedAt.toDate().toLocaleString() : "")
                const resultText = typeof item.result === "string" ? item.result : (item.result && typeof item.result === "object" ? (item.result.outcome ?? JSON.stringify(item.result)) : String(item.result ?? ""))
                const isPositive = resultText.includes("Strong Hire") || resultText === "Hire"
                return (
                  <Card key={item.id ?? index} className="bg-[#1E2127] border-[#30363D] hover:border-[#00FF41] transition-all">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-[#00FF41]">{item.company}</h3>
                            <span className="text-[#8B949E]">•</span>
                            <span className="text-[#8B949E]">{displayDate}</span>
                          </div>
                          <p className="text-[#8B949E]">{item.problem ?? JSON.stringify(item.meta ?? {})}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-[#8B949E]">Runtime</div>
                            <div className="text-[#FFB86C] font-bold">{item.runtime ?? "—"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[#8B949E]">Score</div>
                            <div className="text-[#00FF41] font-bold">{item.score ?? "—"}%</div>
                          </div>
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
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </main>
  )
}
