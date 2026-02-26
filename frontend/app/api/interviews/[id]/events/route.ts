import { NextResponse } from "next/server"

/**
 * Accepts interview events from the client (e.g. submit, phase changes).
 * For now we just acknowledge; events can be persisted to Firestore later for replay/analytics.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing interview id" }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
