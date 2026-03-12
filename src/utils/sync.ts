import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getUid } from './auth';

const SYNC_DEBOUNCE_MS = 2000;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

// Keys to sync to Firestore
const SYNC_KEYS = [
  'pomodoroStudyApp',
  'userData',
  'studyStreak',
  'selectedTheme',
  'isPremium',
  'studyCategories',
  'enhancedFocusSessions',
  'focusHistory',
  'onboardingCompleted',
  'onboardingData',
  'tutorialCompleted',
  'personalizedCategories',
] as const;

// Save all synced data to Firestore (debounced)
export function scheduleSyncToCloud(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncToCloud();
  }, SYNC_DEBOUNCE_MS);
}

async function syncToCloud(): Promise<void> {
  const uid = getUid();
  if (!uid) return;

  const data: Record<string, string | null> = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      data[key] = val;
    }
  }

  try {
    await setDoc(doc(db, 'users', uid), {
      syncedData: data,
      lastSyncAt: new Date().toISOString(),
    }, { merge: true });
  } catch {
    // Offline — will sync next time
  }
}

// Restore all data from Firestore to localStorage
export async function syncFromCloud(): Promise<boolean> {
  const uid = getUid();
  if (!uid) return false;

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return false;

    const syncedData = snap.data().syncedData;
    if (!syncedData) return false;

    let restored = false;
    for (const key of SYNC_KEYS) {
      if (syncedData[key] && !localStorage.getItem(key)) {
        localStorage.setItem(key, syncedData[key]);
        restored = true;
      }
    }
    return restored;
  } catch {
    return false;
  }
}

// Force push current local data to cloud (e.g. after significant action)
export async function forceSyncToCloud(): Promise<void> {
  if (syncTimer) clearTimeout(syncTimer);
  await syncToCloud();
}
