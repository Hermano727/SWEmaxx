import { NextResponse } from "next/server"
import { getInterviewerAnswer } from "@/lib/interview/askInterviewerAdapter"
import type { InterviewEvent } from "@/lib/interview/types"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"

type AskBody = {
  question?: string
  config?: { company?: string; [key: string]: unknown }
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
    console.warn("Ask route: verifyIdToken failed", e)
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
    console.error("Ask route: Firebase Admin init failed", e)
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
    console.error("Ask route: ownership check failed", e)
    return NextResponse.json(
      { error: "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set." },
      { status: 503 }
    )
  }

  let body: AskBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawQuestion = typeof body.question === "string" ? body.question.trim() : ""
  if (!rawQuestion) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 })
  }

  if (rawQuestion.length > 1000) {
    return NextResponse.json({ error: "Question is too long." }, { status: 400 })
  }

  const config = body.config ?? {}
  const company = (config.company as string) ?? "google"
  const code = typeof body.code === "string" ? body.code : ""
  const notes = typeof body.notes === "string" ? body.notes : ""
  const events = Array.isArray(body.events) ? body.events : []

  const answer = await getInterviewerAnswer({
    company,
    question: rawQuestion,
    code,
    notes,
    events,
  })

  if (!answer) {
    return NextResponse.json(
      { error: "Interviewer could not answer at this time. Try again in a moment." },
      { status: 503 }
    )
  }

  return NextResponse.json({ answer })
}

