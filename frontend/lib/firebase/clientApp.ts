"use client";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAppClient } from "./app";

// Lazily return client SDK instances. These functions do not run any
// initialization at module-evaluation time, avoiding throws during SSR/build.
export function getAuthClient() {
	const app = getAppClient()
	if (!app) throw new Error("Firebase client app not initialized. Ensure this code runs in the browser.")
	return getAuth(app)
}

export function getDbClient() {
	const app = getAppClient()
	if (!app) throw new Error("Firebase client app not initialized. Ensure this code runs in the browser.")
	return getFirestore(app)
}

export function getStorageClient() {
	const app = getAppClient()
	if (!app) throw new Error("Firebase client app not initialized. Ensure this code runs in the browser.")
	return getStorage(app)
}