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
      console.log("Firebase Admin projectId:", cert.project_id)
      return admin.initializeApp({ credential: admin.credential.cert(cert) })
    } catch (e) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY:", e)
      throw new Error("Firebase Admin: invalid FIREBASE_SERVICE_ACCOUNT_KEY")
    }
  }
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth()
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore()
}
