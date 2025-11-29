import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from "./clientApp";

// Upload a File/Blob and return the public URL
export async function uploadImage(path: string, file: File | Blob): Promise<string> {
	if (!file) throw new Error("No file provided to uploadImage");

	const storageRef = ref(storage, path);
	const snapshot = await uploadBytesResumable(storageRef, file);
	const url = await getDownloadURL(snapshot.ref);
	return url;
}

