/**
 * Firebase service for daily snapshots
 * Only initializes when Firebase settings are configured
 */

import type { Settings } from '../types';

export interface DailySnapshot {
  date: string;
  totalAsset: number;
  totalProfit: number;
  timestamp: number;
}

// Firebase is loaded dynamically to avoid bundle size when not used
let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;

const SNAPSHOT_CACHE_KEY = 'stock-app-snapshots';

function getLocalSnapshots(): DailySnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setLocalSnapshots(snapshots: DailySnapshot[]) {
  localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshots));
}

export function isFirebaseConfigured(settings: Settings): boolean {
  return !!(settings.firebaseProjectId && settings.firebaseApiKey && settings.firebaseAppId);
}

export async function initFirebase(settings: Settings) {
  if (firebaseApp) return { db: firestoreDb, auth: firebaseAuth };

  const { initializeApp } = await import('firebase/app');
  const { getAuth, signInAnonymously } = await import('firebase/auth');
  const { getFirestore } = await import('firebase/firestore');

  const config = {
    apiKey: settings.firebaseApiKey,
    authDomain: `${settings.firebaseProjectId}.firebaseapp.com`,
    projectId: settings.firebaseProjectId,
    storageBucket: `${settings.firebaseProjectId}.appspot.com`,
    appId: settings.firebaseAppId,
  };

  firebaseApp = initializeApp(config);
  firebaseAuth = getAuth(firebaseApp);
  firestoreDb = getFirestore(firebaseApp);

  try {
    await signInAnonymously(firebaseAuth);
  } catch (err) {
    console.error('Firebase auth error:', err);
  }

  return { db: firestoreDb, auth: firebaseAuth };
}

export async function saveSnapshot(
  settings: Settings,
  snapshot: DailySnapshot
): Promise<void> {
  // Always save locally
  const local = getLocalSnapshots();
  const idx = local.findIndex((s) => s.date === snapshot.date);
  if (idx >= 0) {
    local[idx] = snapshot;
  } else {
    local.push(snapshot);
    local.sort((a, b) => a.date.localeCompare(b.date));
  }
  setLocalSnapshots(local);

  // Save to Firebase if configured
  if (isFirebaseConfigured(settings)) {
    try {
      const { db, auth } = await initFirebase(settings);
      const { doc, setDoc } = await import('firebase/firestore');
      const uid = auth.currentUser?.uid;
      if (uid) {
        const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
        await setDoc(
          doc(db, 'artifacts', appId, 'users', uid, 'daily_snapshots', snapshot.date),
          snapshot
        );
      }
    } catch (err) {
      console.error('Firebase save error:', err);
    }
  }
}

export async function loadSnapshots(settings: Settings): Promise<DailySnapshot[]> {
  // Start with local data
  let snapshots = getLocalSnapshots();

  // Try Firebase if configured
  if (isFirebaseConfigured(settings)) {
    try {
      const { db, auth } = await initFirebase(settings);
      const { collection, getDocs } = await import('firebase/firestore');
      const uid = auth.currentUser?.uid;
      if (uid) {
        const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
        const snap = await getDocs(
          collection(db, 'artifacts', appId, 'users', uid, 'daily_snapshots')
        );
        const firebaseData = snap.docs.map((d: any) => d.data() as DailySnapshot);
        // Merge: Firebase takes priority
        const map = new Map<string, DailySnapshot>();
        snapshots.forEach((s) => map.set(s.date, s));
        firebaseData.forEach((s) => map.set(s.date, s));
        snapshots = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
        setLocalSnapshots(snapshots);
      }
    } catch (err) {
      console.error('Firebase load error:', err);
    }
  }

  return snapshots;
}

export async function deleteSnapshot(
  settings: Settings,
  date: string
): Promise<void> {
  // Remove locally
  const local = getLocalSnapshots().filter((s) => s.date !== date);
  setLocalSnapshots(local);

  // Remove from Firebase if configured
  if (isFirebaseConfigured(settings)) {
    try {
      const { db, auth } = await initFirebase(settings);
      const { doc, deleteDoc } = await import('firebase/firestore');
      const uid = auth.currentUser?.uid;
      if (uid) {
        const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
        await deleteDoc(
          doc(db, 'artifacts', appId, 'users', uid, 'daily_snapshots', date)
        );
      }
    } catch (err) {
      console.error('Firebase delete error:', err);
    }
  }
}
