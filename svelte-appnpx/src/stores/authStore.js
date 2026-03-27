// src/stores/authStore.js

// Import writable store from svelte
import { writable } from 'svelte/store';

// Import authentication and database functions from firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';

// Import firebase database instance
import { db } from '../services/firebase'; 

// Create a writable store for user
export const user = writable(undefined);

// Becomes true once onAuthStateChanged fires for the first time.
// Used by App.svelte to block rendering routes until auth state is known,
// preventing the flash-of-sign-in-page on refresh.
export const authReady = writable(false);

// Initialize Firebase Authentication
const auth = getAuth();

// Listen for changes in authentication state
onAuthStateChanged(auth, async firebaseUser => {
    if (firebaseUser) {
        // If a user is logged in, fetch the user type from the database
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(child(userRef, 'userType'));
        const userType = snapshot.exists() ? snapshot.val() : 'user';

        // Set the user store with the user data and user type
        user.set({ ...firebaseUser, userType });
    } else {
        // If no user is logged in, set the user store to null
        user.set(null);
    }

    // Signal that the initial auth check is complete (fires exactly once per session)
    authReady.set(true);
});
