import { db } from '../services/firebase';
import { ref, set, push, get, remove, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export async function addLandmark(landmark, categoryId) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !categoryId) return false;

    const userLandmarksRef = ref(db, `users/${user.uid}/categories/${categoryId}/landmarks`);
    try {
        const newLandmarkRef = push(userLandmarksRef);
        await set(newLandmarkRef, landmark);
        return true;
    } catch (e) {
        return false;
    }
}

export async function getLandmarks(categoryId) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return [];

    const landmarksRef = ref(db, `users/${user.uid}/categories/${categoryId}/landmarks`);
    try {
        const snapshot = await get(landmarksRef);
        const data = snapshot.val();
        if (!data) return [];
        return Object.entries(data).map(([key, value]) => ({
            id: key,
            isPrivate: value.isPrivate || false,
            ...value
        }));
    } catch (e) {
        return [];
    }
}

export async function updateLandmark(userId, categoryId, landmarkId, details) {
    const landmarkRef = ref(db, `users/${userId}/categories/${categoryId}/landmarks/${landmarkId}`);
    try {
        await update(landmarkRef, details);
        return true;
    } catch (error) {
        return false;
    }
}

export async function deleteLandmark(userId, categoryId, landmarkId) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return false;

    const landmarkRef = ref(db, `users/${user.uid}/categories/${categoryId}/landmarks/${landmarkId}`);
    try {
        await remove(landmarkRef);
        return true;
    } catch (e) {
        return false;
    }
}

export async function fetchLandmark(userId, categoryId, landmarkId) {
    const landmarkRef = ref(db, `users/${userId}/categories/${categoryId}/landmarks/${landmarkId}`);
    const snapshot = await get(landmarkRef);
    if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
    } else {
        throw new Error("Landmark not found");
    }
}
