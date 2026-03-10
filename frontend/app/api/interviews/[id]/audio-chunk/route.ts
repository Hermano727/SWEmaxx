import { NextResponse } from "next/server"
import { Buffer } from "buffer"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import { TranscriptMode, upsertInterviewRow } from "@/lib/db/postgres"
import type { InterviewPhase } from "@/lib/interview/types"
import { getSTTProvider } from "@/lib/interview/sttAdapter"

type AuthError = "no_token" | "invalid_token"

type OwnershipResult =
  | { ok: true; uid: string }
  | { error: string; status: number }

async function getUidFromRequest(
  request: Request
): Promise<{ uid: string } | { error: AuthError }> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null
  if (!token) return { error: "no_token" }
  try {
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(token)
    return { uid: decoded.uid }
  } catch (e) {
    console.warn("Audio chunk route: verifyIdToken failed", e)
    return { error: "invalid_token" }
  }
}

async function assertInterviewOwnership(
  interviewId: string,
  uid: string
): Promise<OwnershipResult> {
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
    return { ok: true, uid }
  } catch (e) {
    console.error("Audio chunk route: ownership check failed", e)
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
      {
        error:
          "Transcript storage is not configured (missing DATABASE_URL).",
      },
      { status: 503 }
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Speech-to-text is not configured (missing OPENAI_API_KEY).",
      },
      { status: 503 }
    )
  }

  let authResult: { uid: string } | { error: AuthError }
  try {
    authResult = await getUidFromRequest(request)
  } catch (e) {
    console.error("Audio chunk route: Firebase Admin init failed", e)
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

  const ownership = await assertInterviewOwnership(id, authResult.uid)
  if (!("ok" in ownership) || !ownership.ok) {
    return NextResponse.json(
      { error: (ownership as { error: string }).error },
      { status: (ownership as { status: number }).status }
    )
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json(
      { error: "Invalid form data for audio chunk." },
      { status: 400 }
    )
  }

  const audioFile = form.get("audio")
  if (!(audioFile instanceof File)) {
    return NextResponse.json(
      { error: "Audio file is required." },
      { status: 400 }
    )
  }

  const sizeLimitBytes =
    Number(process.env.STT_MAX_CHUNK_BYTES ?? "524288") || 524288
  if (audioFile.size <= 0 || audioFile.size > sizeLimitBytes) {
    return NextResponse.json(
      {
        error:
          "Audio chunk size is invalid or too large. Try again or reduce recording duration.",
      },
      { status: 400 }
    )
  }

  const modeRaw = form.get("mode")
  const mode: TranscriptMode =
    modeRaw === "ask_interviewer_question" ||
    modeRaw === "active_interviewer_context"
      ? (modeRaw as TranscriptMode)
      : "silent"

  const phaseRaw = form.get("phase")
  const phase =
    typeof phaseRaw === "string" && phaseRaw.trim().length > 0
      ? (phaseRaw as InterviewPhase)
      : undefined

  const company =
    typeof form.get("company") === "string"
      ? ((form.get("company") as string) || undefined)
      : undefined
  const problemId =
    typeof form.get("problemId") === "string"
      ? ((form.get("problemId") as string) || undefined)
      : undefined
  const problemTitle =
    typeof form.get("problemTitle") === "string"
      ? ((form.get("problemTitle") as string) || undefined)
      : undefined

  const language =
    typeof form.get("language") === "string"
      ? ((form.get("language") as string) || undefined)
      : undefined

  const mimeType = audioFile.type || "audio/webm"
  const arrayBuffer = await audioFile.arrayBuffer()
  const audioBuffer = Buffer.from(arrayBuffer)

  try {
    await upsertInterviewRow({
      interviewId: id,
      userId: ownership.uid,
      company,
      problemId,
      problemTitle,
    })

    const stt = getSTTProvider()
    const { text } = await stt.transcribeChunk({
      audio: audioBuffer,
      mimeType,
      language,
    })

    const normalizedText = (text ?? "").trim()
    return NextResponse.json(
      {
        text: normalizedText,
        mode,
        source: "user",
      },
      { status: 200 }
    )
  } catch (e) {
    console.error("Audio chunk route: failed to process chunk", e)
    return NextResponse.json(
      {
        error: "Failed to process audio chunk.",
      },
      { status: 500 }
    )
  }
}

