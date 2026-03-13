import OpenAI from "openai"
import { config } from "./config.js"

export type InterviewerMessageKind = "question" | "hint" | "meta_feedback"

export type InterviewerAdapterOutput = {
  shouldRespond: boolean
  kind: InterviewerMessageKind
  message: string
}

// Minimal company style mapping (keep aligned with frontend/lib/interview/interviewerAdapter.ts)
function getCompanyStyle(company: string): string {
  const c = company.toLowerCase()
  if (c === "google") {
    return "Google interview style: emphasize problem framing, constraints, edge cases, and clear reasoning before coding."
  }
  if (c === "meta") {
    return "Meta interview style: focus on quickly landing a correct solution and then optimizing with clean implementation."
  }
  if (c === "amazon") {
    return "Amazon interview style: probe tradeoffs and correctness; keep questions concise and practical."
  }
  return "General interview style: direct, fair, concise."
}

export async function getInterviewerMessageFromLLM(params: {
  company: string
  problemTitle?: string
  recentTranscript: string
  codeSnapshot?: string
  phase?: string
  elapsedSeconds?: number | null
  latestUserQuestion?: string | null
  previousMessages: Array<{ role: "user" | "assistant"; text: string; messageType?: string }>
}): Promise<InterviewerAdapterOutput | null> {
  if (!config.openaiApiKey) return null
  const client = new OpenAI({ apiKey: config.openaiApiKey })

  const historySummary =
    params.previousMessages.length > 0
      ? params.previousMessages
          .slice(-5)
          .map((m, idx) => `${idx + 1}. ${m.role === "assistant" ? "You" : "Candidate"}: ${m.text}`)
          .join("\n")
      : "(no prior interviewer messages)"

  const systemPrompt = `You are acting as a live technical interviewer for a coding interview.

Company-specific interviewing style:
${getCompanyStyle(params.company)}

Your job RIGHT NOW is to decide whether to briefly speak up based on the candidate's recent behavior, and if so, to respond with ONE short, high-signal prompt.

Hard constraints:
- You MUST respond with a single JSON object only (no markdown, no code fences, no prose around it).
- Keep messages short: at most 2–4 sentences or a single focused question.
- Do NOT solve the entire problem. Nudge, probe, or reframe instead.
- If you are given a latest user question, answer that question directly first, then optionally add a brief coaching nudge.
- If the candidate seems to be making reasonable progress and you have nothing essential to add, set "shouldRespond": false.

JSON response schema:
{
  "shouldRespond": boolean,
  "kind": "question" | "hint" | "meta_feedback",
  "message": string
}`

  const trimmedTranscript = params.recentTranscript.trim().slice(-4000) || "(recent transcript not available)"
  const trimmedCode = (params.codeSnapshot ?? "").trim().slice(-2000) || "(code snapshot not available)"

  const userPrompt = `Company: ${params.company}
Problem title: ${params.problemTitle ?? "(unspecified)"}

Current phase (if provided): ${params.phase ?? "(unspecified)"}
Approximate elapsed time (seconds): ${typeof params.elapsedSeconds === "number" ? params.elapsedSeconds : "(unknown)"}

Latest user utterance:
${params.latestUserQuestion ?? "(none detected)"}

Recent transcript:
${trimmedTranscript}

Latest code snapshot:
\`\`\`
${trimmedCode}
\`\`\`

Recent interviewer/candidate message history:
${historySummary}

Return the JSON object only.`

  try {
    const completion = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content) as Record<string, unknown>
    const shouldRespond = Boolean(parsed.shouldRespond)
    const kindRaw = (parsed.kind as string) ?? "question"
    const message = typeof parsed.message === "string" ? parsed.message.trim() : ""

    if (!shouldRespond || !message) {
      return { shouldRespond: false, kind: "meta_feedback", message: "" }
    }

    const kind: InterviewerMessageKind =
      kindRaw === "hint" || kindRaw === "meta_feedback" ? (kindRaw as InterviewerMessageKind) : "question"

    return { shouldRespond: true, kind, message }
  } catch {
    return null
  }
}

