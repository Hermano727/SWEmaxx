"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Home } from "lucide-react"

type Mistake = {
  time: string
  severity: "minor" | "major" | "critical"
  message: string
}

export type InterviewResult = {
  id?: string
  company?: string
  rating: "Strong Hire" | "Hire" | "No Hire"
  score: number
  strengths: string[]
  weaknesses: string[]
  mistakes: Mistake[]
}

interface InterviewResultsProps {
  results: InterviewResult
  onRetry: () => void
  onReturnHome: () => void
}

export default function InterviewResults({ results, onRetry, onReturnHome }: InterviewResultsProps) {
  const [mistakesExpanded, setMistakesExpanded] = useState(false)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)

  const getRatingColor = (rating: InterviewResult["rating"]) => {
    if (rating === "Strong Hire") return "text-[#46a758]"
    if (rating === "Hire") return "text-[#fbbf24]"
    return "text-[#f97373]"
  }

  const getSeverityColor = (severity: Mistake["severity"]) => {
    if (severity === "critical") return "text-[#f97373]"
    if (severity === "major") return "text-[#fbbf24]"
    return "text-[#46a758]"
  }

  const companyName = results.company ?? "Google"
  const companyInitial = companyName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0d1117] pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-bold mb-4 ${getRatingColor(results.rating)}`}>{results.rating}</h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-[#30363d] flex items-center justify-center text-white font-bold">
              {companyInitial}
            </div>
            <span className="text-gray-400">{companyName} Interview</span>
          </div>
          <div className="text-4xl font-bold text-white">{results.score}/100</div>
        </div>

        {/* Feedback Sections */}
        <div className="space-y-6">
          {/* Strengths */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex gap-3 text-gray-300 leading-relaxed">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.weaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="flex gap-3 text-gray-300 leading-relaxed">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Mistake Log */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <button
                onClick={() => setMistakesExpanded(!mistakesExpanded)}
                className="w-full flex items-center justify-between"
              >
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Mistake Log ({results.mistakes.length})
                </CardTitle>
                {mistakesExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </CardHeader>
            {mistakesExpanded && (
              <CardContent>
                <div className="space-y-3">
                  {results.mistakes.map((mistake: any, index: number) => (
                    <div key={index} className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-sm text-gray-500">{mistake.time}</span>
                        <span className={`text-sm font-semibold ${getSeverityColor(mistake.severity)}`}>
                          [{mistake.severity.toUpperCase()}]
                        </span>
                        <span className="text-gray-300 flex-1">{mistake.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Transcript */}
          <Card className="bg-[#1a1d23] border-[#30363d]">
            <CardHeader>
              <button
                onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                className="w-full flex items-center justify-between"
              >
                <CardTitle className="text-white">Full Transcript</CardTitle>
                {transcriptExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </CardHeader>
            {transcriptExpanded && (
              <CardContent>
                <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-lg font-mono text-sm text-gray-400">
                  <p>[00:00] Interview started</p>
                  <p>[00:15] User: "So this is a Two Sum problem..."</p>
                  <p>[01:30] User began coding solution</p>
                  <p className="text-yellow-500">[12:34] Mistake detected: syntax error</p>
                  <p>[15:00] User: "Let me optimize this approach..."</p>
                  <p>[42:00] Solution submitted</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Next Steps */}
          <Card className="bg-[#1a1d23] border-[#46a758]">
            <CardHeader>
              <CardTitle className="text-[#46a758]">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-300">
                <p>
                  <span className="font-semibold text-white">Focus Area:</span> Practice discussing time/space
                  complexity tradeoffs before implementing solutions.
                </p>
                <p>
                  <span className="font-semibold text-white">Recommended Problems:</span> Hash Table patterns, Array
                  manipulation
                </p>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="border-[#46a758] text-[#46a758] hover:bg-[#46a758]/10 bg-transparent"
                  >
                    View Similar Problems
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-12">
          <Button asChild variant="outline" className="border-[#30363d] bg-transparent">
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </a>
          </Button>
          <Button variant="outline" onClick={onReturnHome} className="border-[#30363d] bg-transparent">
            Return to Setup
          </Button>
          <Button onClick={onRetry} className="bg-[#46a758] hover:bg-[#3d8f4a] text-white">
            Try Similar Problem
          </Button>
        </div>
      </div>
    </div>
  )
}
