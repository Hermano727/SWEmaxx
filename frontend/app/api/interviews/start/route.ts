import { NextResponse } from "next/server"

// This route is intentionally a stub. Interview sessions are created via
// client-side Firestore writes (recordInterviewStart) and transcript-related
// APIs validate ownership based on that document.
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 404 })
}

