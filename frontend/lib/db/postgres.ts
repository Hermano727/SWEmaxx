import { Pool } from "pg"
import { randomUUID } from "crypto"

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[db] DATABASE_URL is not set. Transcript-related APIs will return 503 until configured."
  )
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
})

/**
 * How a given transcript chunk is meant to be interpreted by downstream
 * consumers (scorecards, live interviewer, history views).
 *
 * - "silent" – passive capture of what the candidate says during the problem.
 * - "ask_interviewer_question" – short utterances that correspond to explicit
 *   Q&A with the interviewer (typed or spoken).
 * - "active_interviewer_context" – background context used by the active
 *   interviewer loop to decide when/how to nudge.
 */
export type TranscriptMode =
  | "silent"
  | "ask_interviewer_question"
  | "active_interviewer_context"

/** Who produced a given transcript chunk. */
export type TranscriptSource = "user" | "interviewer_ai"

/** Role for live interviewer messages rendered in the UI. */
export type MessageRole = "user" | "assistant"

/**
 * Message classification for interviewer messages so we can style and filter
 * them consistently across history and live views.
 */
export type MessageType = "question" | "hint" | "nudged_feedback"

export type TranscriptChunk = {
  id: string
  sequence: number
  text: string
  mode: TranscriptMode
  source: TranscriptSource
  createdAt: string
}

export async function withClient<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function upsertInterviewRow(params: {
  interviewId: string
  userId: string
  company?: string
  problemId?: string
  problemTitle?: string
}): Promise<void> {
  const { interviewId, userId, company, problemId, problemTitle } = params

  await withClient(async (client) => {
    await client.query(
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
  })
}

export async function getNextSequenceForInterview(
  interviewId: string,
  table:
    | "interview_transcripts"
    | "interview_messages" = "interview_transcripts"
): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query<{ next: number }>(
      `
      SELECT COALESCE(MAX(sequence), 0) + 1 AS next
      FROM ${table}
      WHERE interview_id = $1
      `,
      [interviewId]
    )

    return result.rows[0]?.next ?? 1
  })
}

export async function insertTranscriptChunk(params: {
  interviewId: string
  userId: string
  mode: TranscriptMode
  source: TranscriptSource
  text: string
}): Promise<{ id: string; sequence: number }> {
  const { interviewId, userId, mode, source, text } = params
  const id = randomUUID()

  return withClient(async (client) => {
    const result = await client.query<{ sequence: number }>(
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

    const sequence = result.rows[0]?.sequence ?? 1
    return { id, sequence }
  })
}

export async function getTranscriptTextForInterview(
  interviewId: string
): Promise<string> {
  return withClient(async (client) => {
    const result = await client.query<{ text: string }>(
      `
      SELECT text
      FROM interview_transcripts
      WHERE interview_id = $1
      ORDER BY sequence ASC
      `,
      [interviewId]
    )

    return result.rows.map((row) => row.text).join("\n")
  })
}

export async function getTranscriptChunksForInterview(
  interviewId: string
): Promise<TranscriptChunk[]> {
  return withClient(async (client) => {
    const result = await client.query<{
      id: string
      sequence: number
      text: string
      mode: TranscriptMode
      source: TranscriptSource
      created_at: string
    }>(
      `
      SELECT id, sequence, text, mode, source, created_at
      FROM interview_transcripts
      WHERE interview_id = $1
      ORDER BY sequence ASC
      `,
      [interviewId]
    )

    return result.rows.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      text: row.text,
      mode: row.mode,
      source: row.source,
      createdAt: row.created_at,
    }))
  })
}

export async function insertInterviewMessage(params: {
  interviewId: string
  userId: string
  role: MessageRole
  messageType: MessageType
  text: string
}): Promise<{ id: string; sequence: number }> {
  const { interviewId, userId, role, messageType, text } = params
  const id = randomUUID()

  return withClient(async (client) => {
    const result = await client.query<{ sequence: number }>(
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

    const sequence = result.rows[0]?.sequence ?? 1
    return { id, sequence }
  })
}

export type InterviewMessageRecord = {
  id: string
  role: MessageRole
  messageType: MessageType
  text: string
  sequence: number
  createdAt: string
}

export async function getInterviewMessagesForInterview(
  interviewId: string
): Promise<InterviewMessageRecord[]> {
  return withClient(async (client) => {
    const result = await client.query<{
      id: string
      role: MessageRole
      message_type: MessageType
      text: string
      sequence: number
      created_at: string
    }>(
      `
      SELECT id, role, message_type, text, sequence, created_at
      FROM interview_messages
      WHERE interview_id = $1
      ORDER BY sequence ASC
      `,
      [interviewId]
    )

    return result.rows.map((row) => ({
      id: row.id,
      role: row.role,
      messageType: row.message_type,
      text: row.text,
      sequence: row.sequence,
      createdAt: row.created_at,
    }))
  })
}

