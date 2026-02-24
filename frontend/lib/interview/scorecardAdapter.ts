import OpenAI from "openai"
import type { InterviewResult, InterviewEvent } from "./types"

/**
 * Adapter interface for LLM-based interview scoring.
 * Uses OpenAI by default; swap model or provider via env or arguments later.
 * Server-only: do not import from client components.
 */

const DEFAULT_MODEL = "gpt-4o-mini"

export type ScorecardAdapterInput = {
  company: string
  problem?: string
  code: string
  notes: string
  events: InterviewEvent[]
}

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key?.trim()) return null
  return new OpenAI({ apiKey: key })
}

/**
 * Builds a company-specific rubric hint for the prompt.
 */
function getCompanyContext(company: string): string {
  const c = company.toLowerCase()
  if (c === "google") {
    return "Google style: problem framing, clarifying constraints, edge cases, 5–10 min discussion before code, no running code expected, strong follow-ups."
  }
  if (c === "meta") {
    return "Meta style: LC medium style, minimal follow-ups, optimize, implement cleanly."
  }
  if (c === "amazon") {
    return "Amazon style: LC easy–medium, heavy on Leadership Principles even in technical rounds."
  }
  return "General SWE interview: clarification, solution discussion, coding, complexity, communication."
}

/**
 * Calls the LLM to produce a scorecard. Returns null if the key is missing or the request fails.
 * To switch models later: pass model in options or set OPENAI_MODEL env (e.g. gpt-4o).
 */
export async function getScorecardFromLLM(
  input: ScorecardAdapterInput,
  options?: { model?: string }
): Promise<InterviewResult | null> {
  const client = getOpenAIClient()
  if (!client) return null

  const model = options?.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL
  const companyContext = getCompanyContext(input.company)

  const eventsSummary =
    input.events.length > 0
      ? input.events
          .map(
            (e) =>
              `[${e.timestamp}] ${e.phase} ${e.type}: ${JSON.stringify(e.payload ?? {})}`
          )
          .join("\n")
      : "No events recorded."

  const systemPrompt = `You are an expert technical interviewer evaluating a candidate's performance in a coding interview.
Company context: ${companyContext}

Evaluate based on: clarification before coding, solution approach, code quality, edge cases, complexity analysis, communication.
Mistake categories include: didn't clarify constraints, jumped to coding too early, weak dry-run, didn't manage edge cases, didn't explain tradeoffs, poor communication, wrong complexity, unoptimized solution.

Respond with a JSON object only (no markdown, no code block). Required shape:
{
  "rating": "Strong Hire" | "Hire" | "No Hire",
  "score": number (0-100),
  "strengths": string[],
  "weaknesses": string[],
  "mistakes": [{ "time": string, "severity": "minor"|"major"|"critical", "phase": string, "category": string, "message": string }]
}`

  const userPrompt = `Company: ${input.company}

Candidate notes during interview:
${input.notes || "(none)"}

Final code submitted:
\`\`\`
${input.code || "(none)"}
\`\`\`

Events timeline:
${eventsSummary}

Produce the evaluation JSON object only.`

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content) as Record<string, unknown>

    const rating = parsed.rating as InterviewResult["rating"]
    const score = typeof parsed.score === "number" ? parsed.score : 0
    const strengths = Array.isArray(parsed.strengths) ? (parsed.strengths as string[]) : []
    const weaknesses = Array.isArray(parsed.weaknesses) ? (parsed.weaknesses as string[]) : []
    const mistakes = Array.isArray(parsed.mistakes)
      ? (parsed.mistakes as InterviewResult["mistakes"])
      : []

    if (!rating || !["Strong Hire", "Hire", "No Hire"].includes(rating)) {
      return null
    }

    return {
      company: input.company,
      rating,
      score,
      strengths,
      weaknesses,
      mistakes,
    }
  } catch (e) {
    console.error("Scorecard LLM error:", e)
    return null
  }
}
