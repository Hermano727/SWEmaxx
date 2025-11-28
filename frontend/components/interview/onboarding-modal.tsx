"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface OnboardingModalProps {
  onComplete: () => void
  onSkip: () => void
}

const slides = [
  {
    title: "How Interviews Work",
    content: [
      "Interviews follow a structured format: Introduction → Clarification → Coding → Follow-up",
      "Each phase tests different skills and communication patterns",
      "The AI tracks your approach throughout the entire session",
    ],
  },
  {
    title: "What the AI Tracks",
    content: [
      "Communication: How you clarify requirements and explain your thinking",
      "Problem-solving: Your approach to breaking down the problem",
      "Code quality: Implementation details and edge case handling",
      "Mistakes: Logical errors, missed edge cases, and inefficiencies",
    ],
  },
  {
    title: "Company-Specific Grading",
    content: [
      "Each company has unique evaluation criteria",
      "Google emphasizes systems thinking and scalability",
      "Meta focuses on product impact and speed",
      "Amazon values leadership principles and customer obsession",
    ],
  },
  {
    title: "Interview Modes",
    content: [
      "Silent Mode: AI observes quietly and provides feedback at the end",
      "Live Feedback: Get real-time hints at crucial decision points (coming soon)",
      "Choose the mode that matches your learning style",
    ],
  },
]

export default function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleSkip = () => {
    if (dontShowAgain) {
      // Save to localStorage
      localStorage.setItem("skipOnboarding", "true")
    }
    onSkip()
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-[#1a1d23] border-[#30363d] max-w-2xl w-full">
        <CardContent className="p-8">
          {!showSkipConfirm ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#46a758]">Tutorial</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSkipConfirm(true)}
                  className="text-gray-400 hover:text-white"
                >
                  Skip
                </Button>
              </div>

              {/* Slide Content */}
              <div className="mb-8 min-h-[300px]">
                <h3 className="text-xl font-semibold text-white mb-6">{slides[currentSlide].title}</h3>
                <ul className="space-y-4">
                  {slides[currentSlide].content.map((item, index) => (
                    <li key={index} className="flex gap-3 text-gray-300 leading-relaxed">
                      <span className="text-[#46a758] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-8">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide ? "w-8 bg-[#46a758]" : "w-2 bg-gray-600"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="border-[#30363d]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {isLastSlide ? (
                  <Button onClick={onComplete} className="bg-[#46a758] hover:bg-[#3d8f4a] text-white">
                    Get Started
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentSlide(currentSlide + 1)}
                    className="bg-[#46a758] hover:bg-[#3d8f4a] text-white"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            // Skip Confirmation
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Are you sure you want to skip?</h3>
              <p className="text-gray-400 mb-6">
                This tutorial helps you understand how interviews work on our platform.
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                <Checkbox
                  id="dont-show"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                />
                <label htmlFor="dont-show" className="text-sm text-gray-400 cursor-pointer">
                  Don't show this again
                </label>
              </div>

              <p className="text-xs text-gray-500 mb-6">You can always revisit the tutorial in your account settings</p>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setShowSkipConfirm(false)} className="border-[#30363d]">
                  Go Back
                </Button>
                <Button onClick={handleSkip} className="bg-[#46a758] hover:bg-[#3d8f4a] text-white">
                  Skip Tutorial
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
