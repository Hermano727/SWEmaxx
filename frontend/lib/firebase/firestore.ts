import {
  collection,
  addDoc,
  serverTimestamp,
  getFirestore,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "./clientApp";

/**
 * Record when a user starts an interview.
 * Creates a document in the `interviews` collection. Returns the new doc id.
 *
 * @param {string} userId - uid of the signed-in user
 * @param {string | null} interviewId - optional identifier for the interview type
 * @param {object} meta - optional metadata (e.g. difficulty, topic)
 */
export async function recordInterviewStart(
    userId: string,
    interviewId?: string | null,
    meta?: Record<string, any>
): Promise<string> {
  if (!userId) throw new Error("recordInterviewStart requires a userId");

    const payload = {
        userId,
        interviewId: interviewId ?? null,
        meta: meta ?? {},
        startedAt: serverTimestamp(),
        status: "started",
    }

  const colRef = collection(db, "interviews");
  const docRef = await addDoc(colRef, payload);

  return docRef.id;
}

export async function recordInterviewEnd(
    docId: string,
    result: Record<string, any> = {}
): Promise<void> {
    if (!docId) throw new Error("recordInterviewEnd requires a docId");
    
    const docRef = doc(db, "interviews", docId);
    await updateDoc(docRef, {
        endedAt: serverTimestamp(),
        result,
        status: "completed",
    });
}



export function getFirestoreInstance() {
  return getFirestore();
}