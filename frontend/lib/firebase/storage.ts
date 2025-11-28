import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from "./clientApp";

import { updateRestaurantImageReference } from "./firestore";

// Upload a File/Blob and return the public URL
export async function uploadImage(path, file) {
	if (!file) throw new Error("No file provided to uploadImage");

	const storageRef = ref(storage, path);
	const snapshot = await uploadBytesResumable(storageRef, file);
	const url = await getDownloadURL(snapshot.ref);
	return url;
}

// Convenience that uploads and updates a reference in Firestore. This mirrors
// the earlier example naming, but is optional for your current interview use.
export async function updateRestaurantImage(restaurantId, file) {
	if (!restaurantId || !file) throw new Error("Invalid args to updateRestaurantImage");

	const publicUrl = await uploadImage(`restaurants/${restaurantId}/${file.name}`, file);
	await updateRestaurantImageReference(restaurantId, publicUrl);
	return publicUrl;
}