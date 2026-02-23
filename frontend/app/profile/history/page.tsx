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
      // Firestore API returns unsubscribe function. Allows us to call on user change / unmount
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

  const renderBody = () => {
    if (!user) {
      return (
        <Card className="bg-[#242830] border-[#3b3f4d]">
          <CardContent className="p-8 text-center text-[#9ca3af]">
            <div className="mb-4">Sign in to view your interview history.</div>
            <div className="flex justify-center">
              <Button onClick={signIn} className="bg-[#46a758] hover:bg-[#3d9450] text-white">
                Sign in with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (loadingHistory) {
      return (
        <Card className="bg-[#242830] border-[#3b3f4d]">
          <CardContent className="p-8 text-center text-[#9ca3af]">Loading history…</CardContent>
        </Card>
      )
    }

    if (history.length === 0) {
      return (
        <Card className="bg-[#242830] border-[#3b3f4d]">
          <CardContent className="p-8 text-center text-[#9ca3af]">
            No interviews yet — start one to see it appear here.
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id ?? index}>
            <HistoryCard item={item} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 bg-[#1a1d23]">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{">"} Interview History</h1>
          <p className="text-sm text-[#9ca3af]">
            See how your mock interviews have gone over time. Scorecards and configs are stored per session.
          </p>
        </div>

        {renderBody()}
      </div>
    </main>
  )
}
