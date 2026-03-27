import { auth, db } from '../services/firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { get, ref, set, update, push, getDatabase } from 'firebase/database';

const googleProvider = new GoogleAuthProvider();

export async function createUser(email, password, firstName, lastName, userType) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    const database = getDatabase();
    await set(ref(database, 'users/' + user.uid), {
      firstName,
      lastName,
      email,
      userType,
      loginCount: 1
    });

    await recordLoginEvent(user);

    return user;
  } catch (error) {
    throw error;
  }
}

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await recordLoginEvent(user);
    return user;
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (!user.email) {
      throw new Error("Email is required but was not provided by Google sign-in");
    }

    const userRef = ref(getDatabase(), 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      const nameParts = (user.displayName || '').split(' ');
      await set(userRef, {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email,
        photoURL: user.photoURL || '',
        userType: 'user',
        loginCount: 0
      });
    } else {
      await update(userRef, {
        loginCount: (snapshot.val().loginCount || 0) + 1
      });
    }

    await recordLoginEvent(user);

    return user;
  } catch (error) {
    throw error;
  }
};

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return 'Password reset email sent';
  } catch (error) {
    throw error;
  }
}

async function recordLoginEvent(user) {
  const database = getDatabase();
  const userRef = ref(database, `users/${user.uid}`);
  const analyticsRef = ref(database, `users/${user.uid}/analytics/logins`);
  const ip = await fetchIpAddress();

  const loginCountRef = ref(db, `users/${user.uid}/loginCount`);
  const snapshot = await get(loginCountRef);
  const currentCount = (snapshot.val() || 0) + 1;
  await update(userRef, { loginCount: currentCount });

  const newLoginRef = push(analyticsRef);
  await set(newLoginRef, {
    ip,
    date: new Date().toISOString(),
    device: navigator.userAgent
  });
}

async function fetchIpAddress() {
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
}
