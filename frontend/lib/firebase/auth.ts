import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getAuthClient } from "./clientApp";

export function onAuthStateChanged(cb: (user: User | null) => void) {
  const auth = getAuthClient()
  return _onAuthStateChanged(auth, cb)
}

export function onIdTokenChanged(cb: (user: User | null) => void) {
  const auth = getAuthClient()
  return _onIdTokenChanged(auth, cb)
}

export async function signInWithGoogle() {
  const auth = getAuthClient()
  const provider = new GoogleAuthProvider()
  try {
    return await signInWithPopup(auth, provider)
  } catch (err: any) {
    // popup can be cancelled by user or blocked; surface a clearer error
    if (err?.code === "auth/cancelled-popup-request") {
      console.warn("Google sign-in popup was cancelled or another popup was open.")
    } else if (err?.code === "auth/popup-closed-by-user") {
      console.warn("Google sign-in popup closed by the user.")
    } else {
      console.error("Error during signInWithPopup:", err)
    }
    throw err
  }
}

export async function signOut() {
  const auth = getAuthClient()
  return firebaseSignOut(auth)
}

/** Returns the current user's ID token for use in API requests (e.g. Authorization: Bearer <token>). Call from client only. Forces refresh so the token is valid. */
export async function getCurrentIdToken(): Promise<string | null> {
  const auth = getAuthClient()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken(true)
}