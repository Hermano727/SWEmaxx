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

  const renderBody = () => {
    if (!user) {
      return (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="mb-4">Sign in to view your interview history.</div>
            <div className="flex justify-center">
              <Button onClick={signIn} className="bg-primary text-primary-foreground hover:opacity-90">
                Sign in with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (loadingHistory) {
      return (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-muted-foreground">Loading history…</CardContent>
        </Card>
      )
    }

    if (history.length === 0) {
      return (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            No interviews yet. Start one to see it here.
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
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Interview History</h1>
        </header>

        {renderBody()}
      </div>
    </main>
  )
}
