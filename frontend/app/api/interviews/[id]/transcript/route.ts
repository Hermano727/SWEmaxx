import { NextResponse } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import { getTranscriptChunksForInterview } from "@/lib/db/postgres"

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
    console.warn("Transcript route: verifyIdToken failed", e)
    return { error: "invalid_token" }
  }
}

async function assertInterviewOwnership(
  interviewId: string,
  uid: string
): Promise<
  | { ok: true; startedAtMs: number | null; endedAtMs: number | null }
  | { error: string; status: number }
> {
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
    const startedAt =
      typeof data?.startedAt?.toDate === "function"
        ? (data.startedAt.toDate() as Date)
        : null
    const endedAt =
      typeof data?.endedAt?.toDate === "function"
        ? (data.endedAt.toDate() as Date)
        : null

    return {
      ok: true,
      startedAtMs: startedAt ? startedAt.getTime() : null,
      endedAtMs: endedAt ? endedAt.getTime() : null,
    }
  } catch (e) {
    console.error("Transcript route: ownership check failed", e)
    return {
      error:
        "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set correctly.",
      status: 503,
    }
  }
}

export async function GET(
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
    console.error("Transcript route: Firebase Admin init failed", e)
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

  try {
    const chunks = await getTranscriptChunksForInterview(id)

    const startedAtMs =
      "ok" in ownership && ownership.ok ? ownership.startedAtMs : null
    const endedAtMs =
      "ok" in ownership && ownership.ok ? ownership.endedAtMs : null

    const withOffsets = chunks.map((chunk) => {
      let offsetSeconds: number | null = null
      if (startedAtMs != null) {
        const createdMs = Date.parse(chunk.createdAt)
        if (!Number.isNaN(createdMs)) {
          const diff = Math.max(0, Math.round((createdMs - startedAtMs) / 1000))
          offsetSeconds = diff
        }
      }
      return {
        ...chunk,
        offsetSeconds,
      }
    })

    const fullText = withOffsets.map((c) => c.text).join("\n")

    const durationSeconds =
      startedAtMs != null && endedAtMs != null
        ? Math.max(0, Math.round((endedAtMs - startedAtMs) / 1000))
        : null

    return NextResponse.json({
      startedAt: startedAtMs ? new Date(startedAtMs).toISOString() : null,
      endedAt: endedAtMs ? new Date(endedAtMs).toISOString() : null,
      durationSeconds,
      fullText,
      chunks: withOffsets,
    })
  } catch (e) {
    console.error("Transcript route: failed to load transcript", e)
    return NextResponse.json(
      { error: "Failed to load transcript." },
      { status: 500 }
    )
  }
}

