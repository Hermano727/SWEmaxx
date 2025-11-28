"use client";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { app } from "./app";

// Export initialized client SDK singletons for use in Client Components
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);