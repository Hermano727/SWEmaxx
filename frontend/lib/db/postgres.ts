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

export type TranscriptMode =
  | "silent"
  | "ask_interviewer_question"
  | "active_interviewer_context"

export type TranscriptSource = "user" | "interviewer_ai"

export type MessageRole = "user" | "assistant"

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

  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sequence = await getNextSequenceForInterview(
      interviewId,
      "interview_transcripts"
    )

    try {
      await withClient(async (client) => {
        await client.query(
          `
          INSERT INTO interview_transcripts (id, interview_id, user_id, mode, source, sequence, text)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [id, interviewId, userId, mode, source, sequence, text]
        )
      })

      return { id, sequence }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : ""
      lastError = e
      if (
        !message.includes("idx_interview_transcripts_interview_sequence") &&
        !message.includes("interview_transcripts_interview_sequence")
      ) {
        throw e
      }
      // Otherwise, sequence collided; retry with a fresh value.
    }
  }

  throw lastError ?? new Error("Failed to insert transcript chunk after retries")
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

  const sequence = await getNextSequenceForInterview(
    interviewId,
    "interview_messages"
  )

  await withClient(async (client) => {
    await client.query(
      `
      INSERT INTO interview_messages (id, interview_id, user_id, role, message_type, sequence, text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [id, interviewId, userId, role, messageType, sequence, text]
    )
  })

  return { id, sequence }
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

