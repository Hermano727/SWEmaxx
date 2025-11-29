"use client"

import { useEffect, useState } from "react"
import HistoryCard from "./components/HistoryCard"
import { useAuth } from "@/hooks/useAuth"
import { subscribeUserHistory } from "@/lib/firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HistoryPage() {
  const { user, loading, signIn } = useAuth()
  const [history, setHistory] = useState<Array<Record<string, any>>>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true)

  useEffect(() => {
    let unsub: (() => void) | undefined
    if (user?.uid) {
      setLoadingHistory(true)
      unsub = subscribeUserHistory(user.uid, (items) => {
        setHistory(items)
        setLoadingHistory(false)
      })
    } else {
      setHistory([])
      setLoadingHistory(false)
    }

    return () => {
      if (unsub) unsub()
    }
  }, [user])

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{""}{">"} Interview History</h1>

        {!user ? (
          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardContent className="p-8 text-center text-[#8B949E]">
              <div className="mb-4">Sign in to view your interview history.</div>
              <div className="flex justify-center">
                <Button onClick={signIn}>Sign in with Google</Button>
              </div>
            </CardContent>
          </Card>
        ) : loadingHistory ? (
          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardContent className="p-8 text-center text-[#8B949E]">Loading history…</CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardContent className="p-8 text-center text-[#8B949E]">No interviews yet — start one to see it appear here.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item.id ?? index}>
                <HistoryCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
