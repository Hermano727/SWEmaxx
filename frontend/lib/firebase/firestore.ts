import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";

import { getDbClient } from "./clientApp";

/**
 * Skeleton score based on session duration only. Used until we have real grading.
 * TODO: Replace with AI rubric-based scoring (scorecard, mistakes, communication, etc.).
 */
function computeScoreFromDurationSeconds(durationSeconds: number): number {
  // Arbitrary curve: short sessions get lower score, 25–45 min gets 70–90, then plateaus.
  if (durationSeconds <= 0) return 0;
  const minutes = durationSeconds / 60;
  if (minutes < 5) return Math.min(40, Math.round(minutes * 8));
  if (minutes < 25) return Math.min(70, 40 + Math.round((minutes - 5) * 1.5));
  if (minutes <= 45) return 70 + Math.round((minutes - 25));
  return Math.min(95, 90 + Math.round((minutes - 45) * 0.2));
}

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
  };

  const db = getDbClient();
  const colRef = collection(db, "interviews");
  const docRef = await addDoc(colRef, payload);

  return docRef.id;
}

/**
 * Record interview end: writes endedAt, result, status, durationSeconds, and score.
 * Duration is computed from doc's startedAt to now. Score uses a time-based skeleton;
 * TODO: replace with AI grading when available.
 */
export async function recordInterviewEnd(
  docId: string,
  result: Record<string, any> = {}
): Promise<void> {
  if (!docId) throw new Error("recordInterviewEnd requires a docId");

  const db = getDbClient();
  const docRef = doc(db, "interviews", docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Interview document not found");

  const data = snap.data();
  const startedAt = data?.startedAt;
  const startedMs = startedAt?.toDate?.()?.getTime?.() ?? Date.now();
  const nowMs = Date.now();
  const durationSeconds = Math.round((nowMs - startedMs) / 1000);
  const scorecardScore =
    typeof result?.score === "number" ? result.score : undefined;
  const score =
    scorecardScore ?? computeScoreFromDurationSeconds(durationSeconds);

  await updateDoc(docRef, {
    endedAt: serverTimestamp(),
    result,
    status: "completed",
    durationSeconds,
    score,
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