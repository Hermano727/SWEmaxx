import admin from "firebase-admin"
import { config } from "./config.js"

let app: admin.app.App | null = null

function parseServiceAccountKey(): admin.ServiceAccount {
  // SWEmaxx convention: FIREBASE_SERVICE_ACCOUNT_KEY is a JSON string.
  try {
    const parsed = JSON.parse(config.firebaseServiceAccountKey) as Record<string, unknown>
    return parsed as unknown as admin.ServiceAccount
  } catch (e) {
    throw new Error(
      "Invalid FIREBASE_SERVICE_ACCOUNT_KEY. Expected a JSON string for Firebase Admin service account."
    )
  }
}

export function getFirebaseAdmin(): admin.app.App {
  if (app) return app
  if (!config.firebaseServiceAccountKey) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY for Firebase Admin.")
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccountKey()),
  })
  return app
}

export async function verifyIdToken(idToken: string): Promise<{ uid: string }> {
  const a = getFirebaseAdmin()
  const decoded = await a.auth().verifyIdToken(idToken)
  return { uid: decoded.uid }
}

export async function assertInterviewOwnership(
  interviewId: string,
  uid: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const a = getFirebaseAdmin()
  const db = a.firestore()
  const docSnap = await db.collection("interviews").doc(interviewId).get()
  if (!docSnap.exists) {
    return { ok: false, status: 404, error: "Interview not found" }
  }
  const data = docSnap.data()
  if (data?.userId !== uid) {
    return { ok: false, status: 403, error: "Forbidden. You do not own this interview." }
  }
  return { ok: true }
}

