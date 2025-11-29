import { initializeApp, getApps, getApp } from "firebase/app"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Returns an initialized Firebase App for browser (client) usage.
// This avoids initializing Firebase during SSR/build because the
// initialization is guarded by `typeof window`.
export function getAppClient() {
  if (typeof window === "undefined") return null
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

// Returns an initialized Firebase App for server usage. Server code
// that needs the client SDK can call this (but consider using the
// Admin SDK for privileged server operations).
export function getAppServer() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}
