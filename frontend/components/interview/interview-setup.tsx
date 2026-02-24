"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { recordInterviewStart, recordInterviewEnd } from "@/lib/firebase/firestore"
import { signInWithGoogle, onAuthStateChanged } from "@/lib/firebase/auth"

const LOGO_MAP: Record<string, string> = {
  google: "/assets/logos/google.png",
  meta: "/assets/logos/meta.png",
  amazon: "/assets/logos/amazon.svg",
}

interface InterviewSetupProps {
  onStart: (config: any) => void
}

const companies = [
  { id: "google", name: "Google", tagline: "Systems thinking focus" },
  { id: "meta", name: "Meta", tagline: "Product impact & speed" },
  { id: "amazon", name: "Amazon", tagline: "Leadership principles" },
]

export default function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [selectedCompany, setSelectedCompany] = useState("google")
  const [interviewMode, setInterviewMode] = useState("silent")
  const [liveFeedback, setLiveFeedback] = useState(false)
  const [difficulty, setDifficulty] = useState("random")
  const [timeLimit, setTimeLimit] = useState(true)
  const [hintsEnabled, setHintsEnabled] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [interviewDocId, setInterviewDocId] = useState<string | null>(null)
  const [loading, setloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
      setUserId(u ? u.uid : null)
    })
    return unsub
  }, [])

  async function ensureSignedIn() {
    if (userId) return userId
    const result = await signInWithGoogle()
    return result.user.uid
  }

  async function handleStart() {
    setError(null)
    setloading(true)
    let docId: string | null = null
    try {
      const uid = await ensureSignedIn()
      const meta = {
        company: selectedCompany,
        mode: interviewMode,
        liveFeedback,
        difficulty,
        timeLimit,
        hintsEnabled,
      }
      docId = await recordInterviewStart(uid, meta, "web")
      setInterviewDocId(docId)
    } catch (e: any) {
      setError(e.message || "Failed to start interview")
    } finally {
      setloading(false)
    }

    onStart({
      company: selectedCompany,
      mode: interviewMode,
      liveFeedback,
      difficulty,
      timeLimit,
      hintsEnabled,
      interviewDocId: docId,
    })
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Interview Setup</h1>
          <p className="mt-2 text-muted-foreground">Configure your interview parameters to begin</p>
        </header>

        <div className="space-y-8">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Select company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {companies.map((company) => {
                  const logo = LOGO_MAP[company.id]
                  const isSelected = selectedCompany === company.id
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => setSelectedCompany(company.id)}
                      className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {logo ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={logo}
                            alt={company.name}
                            width={40}
                            height={40}
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground">
                          {company.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{company.name}</div>
                        <p className="text-sm text-muted-foreground">{company.tagline}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Interview mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setInterviewMode("silent")}
                  className={`rounded-lg border-2 p-6 text-left transition-colors ${
                    interviewMode === "silent"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <h3 className="font-semibold text-foreground">Silent interviewer</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI observes and grades at the end. Best for realistic practice.
                  </p>
                </button>

                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg border-2 border-border bg-muted/30 p-6 text-left opacity-60"
                >
                  <h3 className="font-semibold text-foreground">
                    Active interviewer
                    <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Coming soon
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI actively engages and provides hints during the interview.
                  </p>
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <Label htmlFor="live-feedback" className="font-medium text-foreground">
                    Live feedback mode
                  </Label>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Get stopped and guided at crucial moments
                  </p>
                </div>
                <Switch
                  id="live-feedback"
                  checked={liveFeedback}
                  onCheckedChange={setLiveFeedback}
                  disabled={interviewMode === "active"}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Question selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="border-border bg-muted/30 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <Label htmlFor="time-limit" className="font-medium text-foreground">
                    Time limit (45 minutes)
                  </Label>
                  <p className="mt-0.5 text-sm text-muted-foreground">Standard interview duration</p>
                </div>
                <Switch id="time-limit" checked={timeLimit} onCheckedChange={setTimeLimit} />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <Label htmlFor="hints" className="font-medium text-foreground">
                    Enable hints
                  </Label>
                  <p className="mt-0.5 text-sm text-muted-foreground">3 hints available during the interview</p>
                </div>
                <Switch id="hints" checked={hintsEnabled} onCheckedChange={setHintsEnabled} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Estimated duration: 45 to 60 minutes</p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              onClick={handleStart}
              size="lg"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:opacity-90 shrink-0"
            >
              {loading ? "Starting…" : "Start interview"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
