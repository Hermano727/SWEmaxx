import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";

import { getDbClient } from "./clientApp";

/**
 * Record when a user starts an interview.
 * Creates a document in the `interviews` collection. Returns the new doc id.
 *
 * @param {string} userId - uid of the signed-in user
 * @param {object} meta - optional metadata (e.g. difficulty, topic)
 * @param {string} origin - optional origin of the interview (kept separate from `meta` so UIs don't show it)
 */
export async function recordInterviewStart(
  userId: string,
  meta?: Record<string, any>,
  origin?: string
): Promise<string> {
  if (!userId) throw new Error("recordInterviewStart requires a userId");

  // Ensure we don't accidentally store `origin` inside `meta`.
  const safeMeta = { ...(meta ?? {}) };
  if (safeMeta.origin) delete safeMeta.origin;

  const payload: Record<string, any> = {
    userId,
    meta: safeMeta,
    origin: origin ?? null,
    startedAt: serverTimestamp(),
    status: "started",
  }

  const db = getDbClient();
  const colRef = collection(db, "interviews");
  const docRef = await addDoc(colRef, payload);

  return docRef.id;
}

export async function recordInterviewEnd(
    docId: string,
    result: Record<string, any> = {}
): Promise<void> {
    if (!docId) throw new Error("recordInterviewEnd requires a docId");
    
    const db = getDbClient();
    const docRef = doc(db, "interviews", docId);
    await updateDoc(docRef, {
        endedAt: serverTimestamp(),
        result,
        status: "completed",
    });
}

export async function fetchUserHistory(userId: string) {
  if (!userId) throw new Error("fetchUserHistory requires a userId");
  const db = getDbClient();
  const q = query(
    collection(db, "interviews"),
    where("userId", "==", userId),
    orderBy("startedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function subscribeUserHistory(
  userId: string,
  cb: (items: Array<Record<string, any>>) => void
) {
  if (!userId) throw new Error("subscribeUserHistory requires a userId");
  const db = getDbClient();
  const q = query(
    collection(db, "interviews"),
    where("userId", "==", userId),
    orderBy("startedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    cb(items);
  });
}

export function getFirestoreInstance() {
  return getDbClient();
}