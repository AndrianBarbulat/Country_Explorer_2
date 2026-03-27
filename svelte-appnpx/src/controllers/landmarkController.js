import { getAuth } from 'firebase/auth';
import * as landmarkModel from '../models/landmarkModel';

export async function createLandmark(landmark, categoryId) {
    if (!landmark.name || !landmark.description || !landmark.latitude || !landmark.longitude) {
        return false;
    }
    return await landmarkModel.addLandmark(landmark, categoryId);
}

// Returns the array directly — the model already maps keys to objects with id
export async function fetchLandmarks(categoryId) {
    return await landmarkModel.getLandmarks(categoryId);
}

export async function modifyLandmark(landmarkId, landmark, categoryId) {
    if (!landmark.name || !landmark.description || !landmark.latitude || !landmark.longitude) {
        return false;
    }
    return await landmarkModel.updateLandmark(landmarkId, landmark, categoryId);
}

export async function removeLandmark(landmarkId, categoryId) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User is not logged in.");
    return await landmarkModel.deleteLandmark(user.uid, categoryId, landmarkId);
}

export async function getLandmarkDetails(categoryId, landmarkId) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User is not logged in.");
    return await landmarkModel.fetchLandmark(user.uid, categoryId, landmarkId);
}

export async function updateLandmarkDetails(categoryId, landmarkId, updatedDetails) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User is not logged in.");
    const { id, ...updatableDetails } = updatedDetails;
    return await landmarkModel.updateLandmark(user.uid, categoryId, landmarkId, updatableDetails);
}
