export type InterviewPhase =
  | "intro"
  | "clarification"
  | "design"
  | "coding"
  | "testing"
  | "wrapUp"

export const INTERVIEW_PHASES: InterviewPhase[] = [
  "intro",
  "clarification",
  "design",
  "coding",
  "testing",
  "wrapUp",
]

export const INTERVIEW_MISTAKE_CATEGORY_LABELS = [
  "didn't clarify constraints",
  "jumped to coding too early",
  "weak dry-run",
  "didn't manage edge cases",
  "didn't explain tradeoffs",
  "poor communication",
  "wrong complexity",
  "unoptimized solution",
] as const

export type InterviewMistakeCategory =
  (typeof INTERVIEW_MISTAKE_CATEGORY_LABELS)[number] | string

export type InterviewMistake = {
  time: string
  severity: "minor" | "major" | "critical"
  phase?: InterviewPhase
  category?: InterviewMistakeCategory
  message: string
}

export type InterviewResult = {
  id?: string
  company?: string
  rating: "Strong Hire" | "Hire" | "No Hire"
  score: number
  strengths: string[]
  weaknesses: string[]
  mistakes: InterviewMistake[]
}

export interface InterviewEvent {
  sessionId?: string
  type: string
  phase: InterviewPhase
  timestamp: string
  payload: Record<string, unknown>
}
