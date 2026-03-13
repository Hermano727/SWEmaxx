import pg from "pg"
import { randomUUID } from "crypto"
import { config } from "./config.js"

const pool = new pg.Pool({
  connectionString: config.databaseUrl || undefined,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

export type TranscriptMode =
  | "silent"
  | "ask_interviewer_question"
  | "active_interviewer_context"

export type TranscriptSource = "user" | "interviewer_ai"

export type MessageRole = "user" | "assistant"
export type MessageType = "question" | "hint" | "nudged_feedback"

export async function upsertInterviewRow(params: {
  interviewId: string
  userId: string
  company?: string
  problemId?: string
  problemTitle?: string
}): Promise<void> {
  const { interviewId, userId, company, problemId, problemTitle } = params

  await pool.query(
    `
    INSERT INTO interviews (id, user_id, company, problem_id, problem_title)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE
    SET
      user_id = EXCLUDED.user_id,
      company = COALESCE(EXCLUDED.company, interviews.company),
      problem_id = COALESCE(EXCLUDED.problem_id, interviews.problem_id),
      problem_title = COALESCE(EXCLUDED.problem_title, interviews.problem_title)
    `,
    [interviewId, userId, company ?? null, problemId ?? null, problemTitle ?? null]
  )
}

export async function insertTranscriptChunkAtomic(params: {
  interviewId: string
  userId: string
  mode: TranscriptMode
  source: TranscriptSource
  text: string
}): Promise<{ id: string; sequence: number }> {
  const { interviewId, userId, mode, source, text } = params
  const id = randomUUID()

  const result = await pool.query<{ sequence: number }>(
    `
    INSERT INTO interview_transcripts (id, interview_id, user_id, mode, source, sequence, text)
    VALUES (
      $1, $2, $3, $4, $5,
      (SELECT COALESCE(MAX(sequence), 0) + 1 FROM interview_transcripts WHERE interview_id = $2),
      $6
    )
    RETURNING sequence
    `,
    [id, interviewId, userId, mode, source, text]
  )

  return { id, sequence: result.rows[0]?.sequence ?? 1 }
}

export async function insertInterviewMessageAtomic(params: {
  interviewId: string
  userId: string
  role: MessageRole
  messageType: MessageType
  text: string
}): Promise<{ id: string; sequence: number }> {
  const { interviewId, userId, role, messageType, text } = params
  const id = randomUUID()

  const result = await pool.query<{ sequence: number }>(
    `
    INSERT INTO interview_messages (id, interview_id, user_id, role, message_type, sequence, text)
    VALUES (
      $1, $2, $3, $4, $5,
      (SELECT COALESCE(MAX(sequence), 0) + 1 FROM interview_messages WHERE interview_id = $2),
      $6
    )
    RETURNING sequence
    `,
    [id, interviewId, userId, role, messageType, text]
  )

  return { id, sequence: result.rows[0]?.sequence ?? 1 }
}

export async function getTranscriptChunks(interviewId: string): Promise<string[]> {
  const result = await pool.query<{ text: string }>(
    `
    SELECT text
    FROM interview_transcripts
    WHERE interview_id = $1
    ORDER BY sequence ASC
    `,
    [interviewId]
  )
  return result.rows.map((r: { text: string }) => r.text)
}

