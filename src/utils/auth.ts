import { Capacitor } from '@capacitor/core';
import { auth, db } from './firebase';
import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Capacitor Firebase Auth plugin (native Apple/Google sign-in on iOS)
let FirebaseAuthentication: any = null;
async function loadNativeAuth() {
  if (Capacitor.isNativePlatform()) {
    try {
      const mod = await import('@capacitor-firebase/authentication');
      FirebaseAuthentication = mod.FirebaseAuthentication;
    } catch {
      // Plugin not available
    }
  }
}
const nativeAuthPromise = loadNativeAuth();

const USERNAME_KEY = 'studyBuddyUsername';
const UID_KEY = 'studyBuddyUid';

// ------ Auth State ------

let currentUser: User | null = null;
const authReadyPromise = new Promise<void>((resolve) => {
  if (!auth) {
    resolve();
    return;
  }
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      localStorage.setItem(UID_KEY, user.uid);
    }
    resolve();
  });
});

export async function waitForAuth(): Promise<void> {
  await authReadyPromise;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getUid(): string | null {
  return currentUser?.uid || localStorage.getItem(UID_KEY);
}

// ------ Sign In ------

export async function signInWithApple(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured');
  await nativeAuthPromise;

  if (Capacitor.isNativePlatform() && FirebaseAuthentication) {
    // Native iOS sign-in (shows the Apple ID sheet)
    const result = await FirebaseAuthentication.signInWithApple();
    // The Capacitor plugin auto-links to Firebase Auth
    // Wait for Firebase Auth state to update
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth!, (user) => {
        if (user) { unsub(); resolve(); }
      });
      // If credential is available, sign in manually
      if (result.credential) {
        const appleProvider = new OAuthProvider('apple.com');
        const oauthCredential = appleProvider.credential({
          idToken: result.credential.idToken,
          rawNonce: result.credential.nonce,
        });
        signInWithCredential(auth!, oauthCredential).then(() => {
          unsub();
          resolve();
        });
      }
    });
  } else {
    // Web fallback — popup sign-in
    const provider = new OAuthProvider('apple.com');
    provider.addScope('name');
    await signInWithPopup(auth, provider);
  }

  if (!auth.currentUser) throw new Error('Sign-in failed');
  currentUser = auth.currentUser;
  localStorage.setItem(UID_KEY, currentUser.uid);
  return currentUser;
}

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured');
  await nativeAuthPromise;

  if (Capacitor.isNativePlatform() && FirebaseAuthentication) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth!, (user) => {
        if (user) { unsub(); resolve(); }
      });
      if (result.credential) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        signInWithCredential(auth!, credential).then(() => {
          unsub();
          resolve();
        });
      }
    });
  } else {
    // Web fallback
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  if (!auth.currentUser) throw new Error('Sign-in failed');
  currentUser = auth.currentUser;
  localStorage.setItem(UID_KEY, currentUser.uid);
  return currentUser;
}

// ------ Username System ------

export function isValidUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3) return 'Username must be at least 3 characters.';
  if (trimmed.length > 20) return 'Username must be 20 characters or less.';
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Only letters, numbers, and underscores allowed.';
  if (/^_|_$/.test(trimmed)) return 'Username cannot start or end with underscore.';
  return null;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  if (!db) return false;
  const normalized = username.toLowerCase().trim();
  try {
    const snap = await getDoc(doc(db, 'usernames', normalized));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function claimUsername(username: string): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  const uid = getUid();
  if (!uid) throw new Error('Must be signed in to claim a username.');

  const normalized = username.toLowerCase().trim();
  const displayName = username.trim();

  // Check if taken
  const snap = await getDoc(doc(db, 'usernames', normalized));
  if (snap.exists()) {
    throw new Error('USERNAME_TAKEN');
  }

  // Claim the username → links to this user's UID
  await setDoc(doc(db, 'usernames', normalized), {
    uid,
    displayName,
    createdAt: new Date().toISOString(),
  });

  // Store username on user profile
  await setDoc(doc(db, 'users', uid), {
    username: normalized,
    displayName,
  }, { merge: true });

  localStorage.setItem(USERNAME_KEY, displayName);
}

export async function loadUsername(): Promise<string | null> {
  // Check local cache first
  const cached = localStorage.getItem(USERNAME_KEY);
  if (cached) return cached;

  // Try to load from Firestore
  const uid = getUid();
  if (!uid || !db) return null;

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists() && snap.data().displayName) {
      localStorage.setItem(USERNAME_KEY, snap.data().displayName);
      return snap.data().displayName;
    }
  } catch {
    // Offline or Firebase not configured
  }
  return null;
}

// ------ State Helpers ------

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function hasAccount(): boolean {
  return getUid() !== null;
}

export function hasUsername(): boolean {
  return localStorage.getItem(USERNAME_KEY) !== null;
}

export function isLoggedIn(): boolean {
  return currentUser !== null || localStorage.getItem(UID_KEY) !== null;
}

export function setLoggedIn(): void {
  // No-op — auth state managed by Firebase
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth) await signOut(auth);
  } catch {
    // Already signed out
  }
  currentUser = null;
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(UID_KEY);
  localStorage.removeItem('studyBuddyLoggedIn');
  localStorage.removeItem('isPremium');
  localStorage.removeItem('pomodoroStudyApp');
  localStorage.removeItem('userData');
  localStorage.removeItem('studyStreak');
  localStorage.removeItem('selectedTheme');
  localStorage.removeItem('onboardingCompleted');
  localStorage.removeItem('onboardingData');
  localStorage.removeItem('tutorialCompleted');
  localStorage.removeItem('personalizedCategories');
  localStorage.removeItem('studyCategories');
  localStorage.removeItem('enhancedFocusSessions');
  localStorage.removeItem('focusHistory');
}

// Legacy compat
export function logout(): void {
  logoutUser();
}

export function getStoredEmail(): string | null {
  return getUsername();
}
