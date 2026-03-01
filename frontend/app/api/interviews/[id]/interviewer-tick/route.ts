import { NextResponse } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import {
  getTranscriptChunksForInterview,
  getInterviewMessagesForInterview,
  insertInterviewMessage,
  upsertInterviewRow,
} from "@/lib/db/postgres"
import { LIVE_INTERVIEWER_LIMITS } from "@/lib/constants/app"
import { getInterviewerMessageFromLLM } from "@/lib/interview/interviewerAdapter"
import type { InterviewPhase } from "@/lib/interview/types"

type AuthError = "no_token" | "invalid_token"

type TickBody = {
  mode?: "active" | "ask_box" | "silent"
  reason?: "on_demand" | "auto"
  codeSnapshot?: string
  meta?: {
    company?: string
    problemId?: string
    problemTitle?: string
    elapsedSeconds?: number
    phase?: InterviewPhase
  }
}

type OwnershipInfo =
  | {
      ok: true
      uid: string
      startedAtMs: number | null
      endedAtMs: number | null
      company?: string
      problemTitle?: string
    }
  | { error: string; status: number }

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
    console.warn("Interviewer tick route: verifyIdToken failed", e)
    return { error: "invalid_token" }
  }
}

async function getOwnershipAndMeta(
  interviewId: string,
  uid: string
): Promise<OwnershipInfo> {
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

    const metaCompany =
      typeof data?.meta?.company === "string" ? (data.meta.company as string) : undefined
    const metaProblemTitle =
      typeof data?.meta?.problemTitle === "string"
        ? (data.meta.problemTitle as string)
        : undefined

    return {
      ok: true,
      uid,
      startedAtMs: startedAt ? startedAt.getTime() : null,
      endedAtMs: endedAt ? endedAt.getTime() : null,
      company: metaCompany,
      problemTitle: metaProblemTitle,
    }
  } catch (e) {
    console.error("Interviewer tick route: ownership check failed", e)
    return {
      error:
        "Server auth error. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set correctly.",
      status: 503,
    }
  }
}

function canSendAnotherMessage(
  existingMessages: Awaited<ReturnType<typeof getInterviewMessagesForInterview>>,
  nowMs: number,
  reason: "on_demand" | "auto"
): boolean {
  const MAX_TOTAL_MESSAGES = LIVE_INTERVIEWER_LIMITS.maxMessagesPerInterview
  const MIN_SPACING_MS =
    reason === "on_demand"
      ? LIVE_INTERVIEWER_LIMITS.minOnDemandSpacingMs
      : LIVE_INTERVIEWER_LIMITS.minAutoSpacingMs

  if (existingMessages.length >= MAX_TOTAL_MESSAGES) {
    return false
  }

  const last = existingMessages[existingMessages.length - 1]
  if (!last) return true

  const lastMs = Date.parse(last.createdAt)
  if (Number.isNaN(lastMs)) return true

  return nowMs - lastMs >= MIN_SPACING_MS
}

function summarizeTranscriptActivity(
  transcriptChunks: Awaited<ReturnType<typeof getTranscriptChunksForInterview>>,
  nowMs: number
): {
  hasAny: boolean
  lastText: string
  lastMs: number | null
  recentWindowText: string
} {
  if (!transcriptChunks.length) {
    return {
      hasAny: false,
      lastText: "",
      lastMs: null,
      recentWindowText: "",
    }
  }

  const last = transcriptChunks[transcriptChunks.length - 1]
  const lastMsRaw = Date.parse(last.createdAt)
  const lastMs = Number.isNaN(lastMsRaw) ? null : lastMsRaw

  const WINDOW_MS = LIVE_INTERVIEWER_LIMITS.autoTranscriptWindowMs
  const recentWindowText = transcriptChunks
    .filter((chunk) => {
      const createdMs = Date.parse(chunk.createdAt)
      if (Number.isNaN(createdMs)) return false
      return nowMs - createdMs <= WINDOW_MS
    })
    .map((chunk) => chunk.text)
    .join(" ")

  return {
    hasAny: true,
    lastText: last.text,
    lastMs,
    recentWindowText,
  }
}

function getLastUserUtterance(
  transcriptChunks: Awaited<ReturnType<typeof getTranscriptChunksForInterview>>
): string | null {
  for (let i = transcriptChunks.length - 1; i >= 0; i -= 1) {
    const chunk = transcriptChunks[i]
    if (chunk.source !== "user") continue
    const text = chunk.text.trim()
    if (text) return text
  }
  return null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing interview id" }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Interviewer is not configured (missing OPENAI_API_KEY)." },
      { status: 503 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error:
          "Interviewer requires transcript storage (DATABASE_URL is not set). Configure a database to use the active interviewer.",
      },
      { status: 503 }
    )
  }

  let authResult: { uid: string } | { error: AuthError }
  try {
    authResult = await getUidFromRequest(request)
  } catch (e) {
    console.error("Interviewer tick route: Firebase Admin init failed", e)
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

  const ownership = await getOwnershipAndMeta(id, uid)
  if (!("ok" in ownership) || !ownership.ok) {
    return NextResponse.json(
      {
        error: (ownership as { error: string }).error,
      },
      { status: (ownership as { status: number }).status }
    )
  }

  let body: TickBody
  try {
    body = (await request.json()) as TickBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const mode = body.mode ?? "active"
  if (mode !== "active") {
    return NextResponse.json({ message: null })
  }

  const reason: "on_demand" | "auto" =
    body.reason === "auto" ? "auto" : "on_demand"

  const nowMs = Date.now()

  try {
    // Ensure the interview row exists in Postgres before inserting messages so the
    // foreign key constraint on interview_messages.interview_id is satisfied.
    await upsertInterviewRow({
      interviewId: id,
      userId: ownership.uid,
      company: ownership.company ?? body.meta?.company,
      problemId: body.meta?.problemId,
      problemTitle: body.meta?.problemTitle ?? ownership.problemTitle,
    })

    const [transcriptChunks, existingMessages] = await Promise.all([
      getTranscriptChunksForInterview(id),
      getInterviewMessagesForInterview(id),
    ])

    const transcriptSummary = summarizeTranscriptActivity(transcriptChunks, nowMs)
    const latestUserUtterance = getLastUserUtterance(transcriptChunks)

    if (reason === "auto") {
      if (!transcriptSummary.hasAny) {
        return NextResponse.json({ message: null })
      }

      if (
        transcriptSummary.lastMs !== null &&
        nowMs - transcriptSummary.lastMs <
          LIVE_INTERVIEWER_LIMITS.autoMinGapSinceLastTranscriptMs
      ) {
        return NextResponse.json({ message: null })
      }

      if (
        transcriptSummary.recentWindowText.trim().length <
        LIVE_INTERVIEWER_LIMITS.autoTranscriptMinChars
      ) {
        return NextResponse.json({ message: null })
      }
    }

    if (!canSendAnotherMessage(existingMessages, nowMs, reason)) {
      return NextResponse.json({ message: null })
    }

    const recentTranscript =
      transcriptSummary.recentWindowText.trim().length > 0
        ? transcriptSummary.recentWindowText
        : transcriptChunks
            .slice(-10)
            .map((c) => c.text)
            .join("\n")

    const company =
      body.meta?.company ??
      ownership.company ??
      "general"

    const problemTitle =
      body.meta?.problemTitle ??
      ownership.problemTitle ??
      undefined

    const elapsedSeconds =
      typeof body.meta?.elapsedSeconds === "number"
        ? body.meta.elapsedSeconds
        : null

    const phase: InterviewPhase | undefined = body.meta?.phase

    const llmResult = await getInterviewerMessageFromLLM({
      company,
      problemTitle,
      recentTranscript,
      codeSnapshot: body.codeSnapshot ?? "",
      phase,
      elapsedSeconds,
      latestUserQuestion: latestUserUtterance,
      previousMessages: existingMessages.map((m) => ({
        role: m.role,
        messageType: m.messageType,
        text: m.text,
      })),
    })

    if (!llmResult || !llmResult.shouldRespond || !llmResult.message.trim()) {
      return NextResponse.json({ message: null })
    }

    const messageType =
      llmResult.kind === "hint"
        ? "hint"
        : llmResult.kind === "meta_feedback"
          ? "nudged_feedback"
          : "question"

    const saved = await insertInterviewMessage({
      interviewId: id,
      userId: uid,
      role: "assistant",
      messageType,
      text: llmResult.message.trim(),
    })

    const replyToTextSnippet =
      latestUserUtterance && latestUserUtterance.length > 140
        ? `${latestUserUtterance.slice(0, 137)}...`
        : latestUserUtterance ?? null

    return NextResponse.json({
      message: {
        id: saved.id,
        text: llmResult.message.trim(),
        kind: llmResult.kind,
        replyToText: replyToTextSnippet,
      },
    })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Interviewer could not respond at this time."
    console.error("Interviewer tick route: error", e)
    return NextResponse.json(
      {
        error: "Interviewer could not respond at this time.",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    )
  }
}

