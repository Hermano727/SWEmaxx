// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { getFirestore } from "firebase/firestore";
import { app } from "./app";

// Simple server-side helpers that return Firebase services tied to the
// initialized `app`. For more advanced server-authenticated operations you
// would normally use the Admin SDK; here we expose the Firestore instance so
// server code can perform read/write operations when appropriate.
export function getServerFirestore() {
  return getFirestore(app);
}