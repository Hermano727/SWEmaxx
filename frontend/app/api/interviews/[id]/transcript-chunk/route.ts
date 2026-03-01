import { NextResponse } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import {
  insertTranscriptChunk,
  TranscriptMode,
  TranscriptSource,
  upsertInterviewRow,
} from "@/lib/db/postgres"
import type { InterviewPhase } from "@/lib/interview/types"

type ChunkBody = {
  text?: string
  mode?: TranscriptMode
  source?: TranscriptSource
  company?: string
  problemId?: string
  problemTitle?: string
  phase?: InterviewPhase
}

type AuthError = "no_token" | "invalid_token"

async function getUidFromRequest(
  request: Request
): Promise<{ uid: string } | { error: AuthError }> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "no_token" }
  try {
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(token)
    return { uid: decoded.uid }
  } catch (e) {
    console.warn("Transcript chunk route: verifyIdToken failed", e)
    return { error: "invalid_token" }
  }
}

async function assertInterviewOwnership(
  interviewId: string,
  uid: string
): Promise<{ ok: true } | { error: string; status: number }> {
  try {
    const db = getAdminFirestore()
    const docSnap = await db.collection("interviews").doc(interviewId).get()
    if (!docSnap.exists) {
      return { error: "Interview not found", status: 404 }
    }
    const data = docSnap.data()
    if (data?.userId !== uid) {
      return {
        error: "Forbidden. You do not own this interview.",
        status: 403,
      }
    }
    return { ok: true }
  } catch (e) {
    console.error("Transcript chunk route: ownership check failed", e)
    return {
      error:
        "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set correctly.",
      status: 503,
    }
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

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Transcript storage is not configured (missing DATABASE_URL)." },
      { status: 503 }
    )
  }

  let authResult: { uid: string } | { error: AuthError }
  try {
    authResult = await getUidFromRequest(request)
  } catch (e) {
    console.error("Transcript chunk route: Firebase Admin init failed", e)
    return NextResponse.json(
      {
        error: "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set.",
      },
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

  const ownership = await assertInterviewOwnership(id, uid)
  if ("error" in ownership) {
    return NextResponse.json(
      { error: ownership.error },
      { status: ownership.status }
    )
  }

  let body: ChunkBody
  try {
    body = (await request.json()) as ChunkBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawText = typeof body.text === "string" ? body.text.trim() : ""
  if (!rawText) {
    return NextResponse.json(
      { error: "Transcript text is required." },
      { status: 400 }
    )
  }

  const mode: TranscriptMode =
    body.mode === "ask_interviewer_question" ||
    body.mode === "active_interviewer_context"
      ? body.mode
      : "silent"

  const source: TranscriptSource =
    body.source === "interviewer_ai" ? "interviewer_ai" : "user"

  try {
    await upsertInterviewRow({
      interviewId: id,
      userId: uid,
      company: body.company,
      problemId: body.problemId,
      problemTitle: body.problemTitle,
    })

    const { sequence } = await insertTranscriptChunk({
      interviewId: id,
      userId: uid,
      mode,
      source,
      text: rawText,
    })

    return NextResponse.json({ text: rawText, sequence })
  } catch (e) {
    console.error("Transcript chunk route: failed to save chunk", e)
    return NextResponse.json(
      { error: "Failed to save transcript chunk." },
      { status: 500 }
    )
  }
}

