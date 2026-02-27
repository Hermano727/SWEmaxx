-- Postgres schema for interview-related data.
-- This file is informational; run these statements in your Postgres instance.

-- Core interviews table (Postgres-side view of an interview).
-- We use the Firestore interview document ID as the primary key here.
CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,          -- Firestore interview doc id
  user_id TEXT NOT NULL,        -- Firebase UID
  company TEXT,                 -- e.g. 'google', 'meta', 'amazon'
  problem_id TEXT,
  problem_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Transcript chunks captured during an interview (spoken or typed).
CREATE TABLE IF NOT EXISTS interview_transcripts (
  id TEXT PRIMARY KEY,          -- generated in app via crypto.randomUUID()
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,        -- Firebase UID
  mode TEXT NOT NULL,           -- 'silent' | 'ask_interviewer_question' | 'active_interviewer_context'
  source TEXT NOT NULL,         -- 'user' | 'interviewer_ai'
  sequence INTEGER NOT NULL,    -- monotonically increasing per interview
  text TEXT NOT NULL,           -- transcript chunk
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_transcripts_interview_sequence
  ON interview_transcripts (interview_id, sequence);

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_user
  ON interview_transcripts (user_id);

-- Messages exchanged during an interview (for active interviewer mode and Q&A).
CREATE TABLE IF NOT EXISTS interview_messages (
  id TEXT PRIMARY KEY,          -- generated in app via crypto.randomUUID()
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,        -- Firebase UID
  role TEXT NOT NULL,           -- 'user' | 'assistant'
  message_type TEXT NOT NULL,   -- 'question' | 'hint' | 'nudged_feedback'
  sequence INTEGER NOT NULL,    -- monotonically increasing per interview
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_messages_interview_sequence
  ON interview_messages (interview_id, sequence);

CREATE INDEX IF NOT EXISTS idx_interview_messages_user
  ON interview_messages (user_id);

