// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { getFirestore } from "firebase/firestore";
import { getAppServer } from "./app";

// Simple server-side helper that returns a Firestore instance backed by
// a Firebase App initialized on the server. For privileged server
// operations consider using the Admin SDK instead.
export function getServerFirestore() {
  const app = getAppServer()
  return getFirestore(app)
}