export type InterviewResult = {
  id?: string
  company?: string
  rating: "Strong Hire" | "Hire" | "No Hire"
  score: number
  strengths: string[]
  weaknesses: string[]
  mistakes: Array<{
    time: string
    severity: "minor" | "major" | "critical"
    phase?: string
    category?: string
    message: string
  }>
}

export interface InterviewEvent {
  sessionId?: string
  type: string
  phase: string
  timestamp: string
  payload: Record<string, unknown>
}
