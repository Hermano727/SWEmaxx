/**
 * Firebase Admin SDK for server-only use (API routes).
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or GOOGLE_APPLICATION_CREDENTIALS.
 */
import * as admin from "firebase-admin"

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app()
  }
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (key) {
    try {
      const cert = JSON.parse(key) as admin.ServiceAccount
      return admin.initializeApp({ credential: admin.credential.cert(cert) })
    } catch (e) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY:", e)
      throw new Error("Firebase Admin: invalid FIREBASE_SERVICE_ACCOUNT_KEY")
    }
  }

  // Fall back to application default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS)
  // which is common in hosted environments.
  try {
    return admin.initializeApp()
  } catch (e) {
    console.error("Firebase Admin init failed:", e)
    throw new Error(
      "Firebase Admin: missing FIREBASE_SERVICE_ACCOUNT_KEY and no application default credentials available."
    )
  }
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth()
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore()
}
