import http from "http"
import { WebSocketServer, WebSocket } from "ws"
import { config } from "./config.js"
import { log } from "./logger.js"
import { verifyIdToken, assertInterviewOwnership } from "./firebase.js"
import {
  TranscriptMode,
  upsertInterviewRow,
  insertTranscriptChunkAtomic,
  insertInterviewMessageAtomic,
  getTranscriptChunks,
} from "./db.js"
import { startDeepgramLive } from "./deepgram.js"
import { getInterviewerMessageFromLLM } from "./openaiInterviewer.js"

type ClientState = {
  uid: string | null
  interviewId: string | null
  mode: TranscriptMode
  company?: string
  problemId?: string
  problemTitle?: string
  isTyping: boolean
  pendingUtteranceText: string
  pendingCommitTimer: ReturnType<typeof setTimeout> | null
  dg: ReturnType<typeof startDeepgramLive> | null
  ownershipCache: Map<string, { ok: boolean; expiresAt: number }>
}

type ClientMsg =
  | { type: "auth"; token: string }
  | {
      type: "start"
      interviewId: string
      mode?: TranscriptMode
      company?: string
      problemId?: string
      problemTitle?: string
    }
  | { type: "typing"; interviewId: string; isTyping: boolean }
  | {
      type: "request_interviewer_feedback"
      interviewId: string
      codeSnapshot?: string
      meta?: { phase?: string; elapsedSeconds?: number; problemTitle?: string; company?: string }
    }

function safeJsonParse(raw: string): ClientMsg | null {
  try {
    return JSON.parse(raw) as ClientMsg
  } catch {
    return null
  }
}

async function cachedOwnershipCheck(state: ClientState, interviewId: string, uid: string) {
  const cached = state.ownershipCache.get(interviewId)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.ok
  }
  const res = await assertInterviewOwnership(interviewId, uid)
  const ok = "ok" in res && res.ok
  state.ownershipCache.set(interviewId, { ok, expiresAt: now + config.ownershipCacheTtlMs })
  return ok
}

function send(ws: WebSocket, payload: Record<string, unknown>) {
  ws.send(JSON.stringify(payload))
}

function scheduleCommit(ws: WebSocket, state: ClientState) {
  if (state.pendingCommitTimer) {
    clearTimeout(state.pendingCommitTimer)
    state.pendingCommitTimer = null
  }

  const delay = state.isTyping ? config.typingCommitDelayMs : 0
  state.pendingCommitTimer = setTimeout(async () => {
    state.pendingCommitTimer = null
    const text = state.pendingUtteranceText.trim()
    if (!text || !state.uid || !state.interviewId) return

    try {
      await upsertInterviewRow({
        interviewId: state.interviewId,
        userId: state.uid,
        company: state.company,
        problemId: state.problemId,
        problemTitle: state.problemTitle,
      })

      const saved = await insertTranscriptChunkAtomic({
        interviewId: state.interviewId,
        userId: state.uid,
        mode: state.mode,
        source: "user",
        text,
      })

      state.pendingUtteranceText = ""

      send(ws, {
        type: "transcript_committed",
        sequence: saved.sequence,
        text,
      })
    } catch (e) {
      send(ws, { type: "error", error: "Failed to commit transcript." })
      log("error", "commit_transcript_failed", { err: String((e as any)?.message ?? e) })
    }
  }, delay)
}

const server = http.createServer((req, res) => {
  if (req.url === config.healthPath) {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server, path: config.voiceWsPath })

wss.on("connection", (ws) => {
  const state: ClientState = {
    uid: null,
    interviewId: null,
    mode: "silent",
    company: undefined,
    problemId: undefined,
    problemTitle: undefined,
    isTyping: false,
    pendingUtteranceText: "",
    pendingCommitTimer: null,
    dg: null,
    ownershipCache: new Map(),
  }

  log("info", "ws_connected")
  send(ws, { type: "hello" })

  ws.on("message", async (data, isBinary) => {
    try {
      if (isBinary) {
        if (!state.uid || !state.interviewId || !state.dg) return
        state.dg.sendAudio(new Uint8Array(data as Buffer))
        return
      }

      const raw = data.toString()
      const msg = safeJsonParse(raw)
      if (!msg) {
        send(ws, { type: "error", error: "Invalid JSON message." })
        return
      }

      if (msg.type === "auth") {
        const token = msg.token?.trim()
        if (!token) {
          send(ws, { type: "error", error: "Missing auth token." })
          return
        }
        const { uid } = await verifyIdToken(token)
        state.uid = uid
        send(ws, { type: "authed", uid })
        return
      }

      if (!state.uid) {
        send(ws, { type: "error", error: "Not authenticated." })
        return
      }

      if (msg.type === "start") {
        const interviewId = msg.interviewId?.trim()
        if (!interviewId) {
          send(ws, { type: "error", error: "Missing interviewId." })
          return
        }

        const ok = await cachedOwnershipCheck(state, interviewId, state.uid)
        if (!ok) {
          send(ws, { type: "error", error: "Forbidden interview." })
          return
        }

        state.interviewId = interviewId
        state.mode = msg.mode ?? "active_interviewer_context"
        state.company = msg.company
        state.problemId = msg.problemId
        state.problemTitle = msg.problemTitle

        if (state.dg) {
          state.dg.close()
          state.dg = null
        }

        state.pendingUtteranceText = ""

        state.dg = startDeepgramLive({
          onPartial: (text) => {
            send(ws, { type: "stt_partial", text })
          },
          onFinalSegment: (text) => {
            state.pendingUtteranceText = `${state.pendingUtteranceText} ${text}`.trim()
            send(ws, { type: "stt_final_segment", text })
          },
          onSpeechFinal: () => {
            // Deepgram thinks the user stopped speaking; commit as an utterance.
            scheduleCommit(ws, state)
          },
          onError: () => {
            send(ws, { type: "error", error: "STT provider error." })
          },
        })

        send(ws, { type: "started", interviewId })
        return
      }

      if (msg.type === "typing") {
        if (msg.interviewId !== state.interviewId) return
        state.isTyping = Boolean(msg.isTyping)
        return
      }

      if (msg.type === "request_interviewer_feedback") {
        const interviewId = msg.interviewId?.trim()
        if (!interviewId || interviewId !== state.interviewId) {
          send(ws, { type: "error", error: "Invalid interviewId." })
          return
        }

        const ok = await cachedOwnershipCheck(state, interviewId, state.uid)
        if (!ok) {
          send(ws, { type: "error", error: "Forbidden interview." })
          return
        }

        const company = msg.meta?.company ?? state.company ?? "general"
        const problemTitle = msg.meta?.problemTitle ?? state.problemTitle
        const phase = msg.meta?.phase
        const elapsedSeconds =
          typeof msg.meta?.elapsedSeconds === "number" ? msg.meta.elapsedSeconds : null

        // Merge persisted transcript with any pending utterance not yet committed.
        const persisted = await getTranscriptChunks(interviewId)
        const pending = state.pendingUtteranceText.trim()
        const recentTranscript =
          (persisted.slice(-20).join("\n") + (pending ? `\n${pending}` : "")).trim() ||
          "(recent transcript not available)"

        const llm = await getInterviewerMessageFromLLM({
          company,
          problemTitle,
          recentTranscript,
          codeSnapshot: msg.codeSnapshot ?? "",
          phase,
          elapsedSeconds,
          latestUserQuestion: pending || (persisted[persisted.length - 1] ?? null),
          previousMessages: [],
        })

        if (!llm || !llm.shouldRespond || !llm.message.trim()) {
          send(ws, { type: "interviewer_message", message: null })
          return
        }

        const messageType =
          llm.kind === "hint" ? "hint" : llm.kind === "meta_feedback" ? "nudged_feedback" : "question"

        const saved = await insertInterviewMessageAtomic({
          interviewId,
          userId: state.uid,
          role: "assistant",
          messageType,
          text: llm.message.trim(),
        })

        send(ws, {
          type: "interviewer_message",
          message: {
            id: saved.id,
            kind: llm.kind,
            text: llm.message.trim(),
          },
        })
        return
      }

      send(ws, { type: "error", error: "Unknown message type." })
    } catch (e) {
      send(ws, { type: "error", error: "Server error." })
      log("error", "ws_message_error", { err: String((e as any)?.message ?? e) })
    }
  })

  ws.on("close", () => {
    if (state.pendingCommitTimer) clearTimeout(state.pendingCommitTimer)
    state.dg?.close()
    log("info", "ws_closed")
  })
})

server.listen(config.port, () => {
  log("info", "voice_gateway_listening", {
    port: config.port,
    wsPath: config.voiceWsPath,
    healthPath: config.healthPath,
  })
})

