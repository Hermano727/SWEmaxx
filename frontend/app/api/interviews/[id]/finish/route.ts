import { NextResponse } from "next/server"
import { getScorecardFromLLM } from "@/lib/interview/scorecardAdapter"
import type { InterviewEvent } from "@/lib/interview/types"

type FinishBody = {
  config?: { company?: string; [key: string]: unknown }
  code?: string
  notes?: string
  events?: InterviewEvent[]
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing interview id" }, { status: 400 })
  }

  let body: FinishBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const config = body.config ?? {}
  const company = (config.company as string) ?? "google"
  const code = typeof body.code === "string" ? body.code : ""
  const notes = typeof body.notes === "string" ? body.notes : ""
  const events = Array.isArray(body.events) ? body.events : []

  const scorecard = await getScorecardFromLLM({
    company,
    code,
    notes,
    events,
  })

  if (!scorecard) {
    return NextResponse.json(
      { error: "Scorecard generation failed. Check OPENAI_API_KEY and logs." },
      { status: 503 }
    )
  }

  return NextResponse.json({ scorecard })
}
