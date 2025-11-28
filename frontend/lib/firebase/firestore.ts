import {
  collection,
  addDoc,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";

import { db } from "./clientApp";

/**
 * Record when a user starts an interview.
 * Creates a document in the `interviews` collection. Returns the new doc id.
 *
 * @param {string} userId - uid of the signed-in user
 * @param {string} interviewId - optional identifier for the interview type
 * @param {object} meta - optional metadata (e.g. difficulty, topic)
 */
export async function recordInterviewStart(userId, interviewId = null, meta = {}) {
  if (!userId) throw new Error("recordInterviewStart requires a userId");

  const docRef = await addDoc(collection(db, "interviews"), {
    userId,
    interviewId,
    meta,
    startedAt: serverTimestamp(),
  });

  return docRef.id;
}

export function getFirestoreInstance() {
  return getFirestore();
}