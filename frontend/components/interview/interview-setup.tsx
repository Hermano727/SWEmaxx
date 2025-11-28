"use client"

import { useState, useEffect } from "react"
import { Building2, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { auth } from "@/lib/firebase/clientApp"
import { recordInterviewStart, recordInterviewEnd } from "@/lib/firebase/firestore"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"

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
  // Firebase Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [interviewDocId, setInterviewDocId] = useState<string | null>(null);
  const [loading, setloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    setUserId(user ? user.uid : null);
  }, [])

  async function ensureSignedIn() {
    if (auth.currentUser) return auth.currentUser.uid;
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user.uid;
  }

  async function handleStart() {
    setError(null);
    setloading(true);
    let docId: string | null = null;
    try {
      const uid = await ensureSignedIn();
      docId = await recordInterviewStart(uid, null, { origin: "web" });
      setInterviewDocId(docId);
    } catch (e: any) {
      setError(e.message || "Failed to start interview");
    } finally {
      setloading(false);
    }

    // Pass the interviewDocId back to the caller so the running interview can
    // associate future end/update calls with this document. This keeps
    // persistence decoupled from the UI config object.
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
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0d1117]">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[#46a758] mb-4">Interview Setup</h1>
          <p className="text-gray-400">Configure your interview parameters to begin</p>
        </div>

        <div className="space-y-8">
          {/* Company Selection */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#46a758]" />
                Select Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCompany === company.id
                        ? "border-[#46a758] bg-[#46a758]/10"
                        : "border-[#30363d] hover:border-[#46a758]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[#30363d] flex items-center justify-center text-white font-bold">
                        {company.name[0]}
                      </div>
                      <div className="font-semibold text-white">{company.name}</div>
                    </div>
                    <p className="text-sm text-gray-400">{company.tagline}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interview Mode */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#46a758]" />
                Interview Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setInterviewMode("silent")}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    interviewMode === "silent"
                      ? "border-[#46a758] bg-[#46a758]/10"
                      : "border-[#30363d] hover:border-[#46a758]/50"
                  }`}
                >
                  <h3 className="font-semibold text-white mb-2">Silent Interviewer</h3>
                  <p className="text-sm text-gray-400">
                    AI observes and grades at the end. Best for realistic practice.
                  </p>
                </button>

                <button
                  onClick={() => setInterviewMode("active")}
                  disabled
                  className="p-6 rounded-lg border-2 border-[#30363d] bg-[#30363d]/20 text-left opacity-50 cursor-not-allowed"
                >
                  <h3 className="font-semibold text-white mb-2">
                    Active Interviewer
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Coming Soon</span>
                  </h3>
                  <p className="text-sm text-gray-400">AI actively engages and provides hints during interview.</p>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <div>
                  <Label htmlFor="live-feedback" className="text-white font-medium">
                    Live Feedback Mode
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">Get stopped and guided at crucial moments</p>
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

          {/* Question Selection & Advanced Options */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <CardTitle className="text-white">Question Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d23] border-[#30363d]">
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <div>
                  <Label htmlFor="time-limit" className="text-white font-medium">
                    Time Limit (45 minutes)
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">Standard interview duration</p>
                </div>
                <Switch id="time-limit" checked={timeLimit} onCheckedChange={setTimeLimit} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <div>
                  <Label htmlFor="hints" className="text-white font-medium">
                    Enable Hints
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">3 hints available during interview</p>
                </div>
                <Switch id="hints" checked={hintsEnabled} onCheckedChange={setHintsEnabled} />
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <div className="flex items-center justify-between p-6 bg-[#1a1d23] border border-[#30363d] rounded-lg">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Estimated duration: 45-60 minutes</span>
            </div>
            <Button onClick={handleStart} size="lg" className="bg-[#46a758] hover:bg-[#3d8f4a] text-white">
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
