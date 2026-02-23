"use client"

import { useState } from "react"
import OnboardingModal from "@/components/interview/onboarding-modal"
import InterviewSetup from "@/components/interview/interview-setup"
import InterviewScreen from "@/components/interview/interview-screen"
import InterviewResults, { type InterviewResult } from "@/components/interview/interview-results"
import { Navbar } from "@/components/common/navbar"

type FlowState = "onboarding" | "setup" | "interview" | "results"

export default function InterviewPage() {
  const [flowState, setFlowState] = useState<FlowState>("setup")
  const [showOnboarding, setShowOnboarding] = useState(false) // Set to true for first-time users
  const [interviewConfig, setInterviewConfig] = useState<any>(null)
  const [interviewResults, setInterviewResults] = useState<InterviewResult | null>(null)

  const handleStartInterview = (config: any) => {
    setInterviewConfig(config)
    setFlowState("interview")
  }

  const handleFinishInterview = (results: InterviewResult) => {
    setInterviewResults(results)
    setFlowState("results")
  }

  const handleReturnToSetup = () => {
    setFlowState("setup")
    setInterviewConfig(null)
    setInterviewResults(null)
  }

  return (
    <main className="min-h-screen">
      {(flowState === "setup" || flowState === "results") && <Navbar />}

      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboarding(false)
            setFlowState("setup")
          }}
          onSkip={() => {
            setShowOnboarding(false)
            setFlowState("setup")
          }}
        />
      )}

      {flowState === "setup" && <InterviewSetup onStart={handleStartInterview} />}

      {flowState === "interview" && interviewConfig && (
        <InterviewScreen config={interviewConfig} onFinish={handleFinishInterview} onExit={handleReturnToSetup} />
      )}

      {flowState === "results" && interviewResults && (
        <InterviewResults
          results={interviewResults}
          onRetry={() => setFlowState("interview")}
          onReturnHome={handleReturnToSetup}
        />
      )}
    </main>
  )
}
