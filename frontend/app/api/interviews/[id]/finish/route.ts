import { NextResponse } from "next/server"
import { getScorecardFromLLM } from "@/lib/interview/scorecardAdapter"
import type { InterviewEvent } from "@/lib/interview/types"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import { getTranscriptTextForInterview } from "@/lib/db/postgres"

type FinishBody = {
  config?: {
    company?: string
    problemTitle?: string
    problem?: { title?: string; [key: string]: unknown }
    [key: string]: unknown
  }
  code?: string
  notes?: string
  events?: InterviewEvent[]
}

async function getUidFromRequest(
  request: Request
): Promise<{ uid: string } | { error: "no_token" | "invalid_token" }> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "no_token" }
  try {
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(token)
    return { uid: decoded.uid }
  } catch (e) {
    console.warn("Finish route: verifyIdToken failed", e)
    return { error: "invalid_token" }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing interview id" }, { status: 400 })
  }

  let authResult: { uid: string } | { error: "no_token" | "invalid_token" }
  try {
    authResult = await getUidFromRequest(request)
  } catch (e) {
    console.error("Finish route: Firebase Admin init failed", e)
    return NextResponse.json(
      { error: "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set." },
      { status: 503 }
    )
  }
  if ("error" in authResult) {
    const message =
      authResult.error === "no_token"
        ? "No auth token. Sign in and start the interview from the setup screen."
        : "Invalid or expired token. Return to setup and sign in again."
    return NextResponse.json({ error: message }, { status: 401 })
  }
  const uid = authResult.uid

  try {
    const db = getAdminFirestore()
    const docSnap = await db.collection("interviews").doc(id).get()
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }
    const data = docSnap.data()
    if (data?.userId !== uid) {
      return NextResponse.json({ error: "Forbidden. You do not own this interview." }, { status: 403 })
    }
  } catch (e) {
    console.error("Finish route: ownership check failed", e)
    return NextResponse.json(
      { error: "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set." },
      { status: 503 }
    )
  }

  let body: FinishBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const config = body.config ?? {}
  const company = (config.company as string) ?? "google"
  const problem =
    typeof config.problemTitle === "string" && config.problemTitle.trim() !== ""
      ? config.problemTitle.trim()
      : typeof config.problem?.title === "string" && config.problem.title.trim() !== ""
        ? config.problem.title.trim()
        : undefined
  const code = typeof body.code === "string" ? body.code : ""
  const notes = typeof body.notes === "string" ? body.notes : ""
  const events = Array.isArray(body.events) ? body.events : []

  let transcriptText = ""
  if (process.env.DATABASE_URL) {
    try {
      transcriptText = await getTranscriptTextForInterview(id)
    } catch (e) {
      console.error("Finish route: failed to load transcript text", e)
    }
  }

  const combinedNotes = buildCombinedNotes(notes, transcriptText)

  const scorecard = await getScorecardFromLLM({
    company,
    problem,
    code,
    notes: combinedNotes,
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

function buildCombinedNotes(typedNotes: string, transcript: string): string {
  const cleanTyped = (typedNotes || "").trim()
  const cleanTranscript = (transcript || "").trim()

  if (cleanTyped && cleanTranscript) {
    return `Candidate spoken transcript:\n${cleanTranscript}\n\nTyped notes:\n${cleanTyped}`
  }

  if (cleanTranscript) {
    return `Candidate spoken transcript:\n${cleanTranscript}`
  }

  return cleanTyped
}
