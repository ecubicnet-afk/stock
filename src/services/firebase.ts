/**
 * Firebase service for daily snapshots and cloud sync
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
let lastConfigKey = '';

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

function getConfigKey(settings: Settings): string {
  return `${settings.firebaseProjectId}|${settings.firebaseApiKey}|${settings.firebaseAppId}`;
}

export async function initFirebase(settings: Settings) {
  const configKey = getConfigKey(settings);

  // Return cached instance if config hasn't changed
  if (firebaseApp && configKey === lastConfigKey) {
    return { db: firestoreDb, auth: firebaseAuth };
  }

  // Config changed — re-initialize
  if (firebaseApp) {
    try {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(firebaseApp);
    } catch {
      // ignore cleanup errors
    }
    firebaseApp = null;
    firestoreDb = null;
    firebaseAuth = null;
  }

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
  lastConfigKey = configKey;

  // Auth failure should propagate — don't swallow
  await signInAnonymously(firebaseAuth);

  return { db: firestoreDb, auth: firebaseAuth };
}

/** Test Firebase connection and return a clear result */
export async function testFirebaseConnection(
  settings: Settings
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured(settings)) {
    return { success: false, error: 'Firebase設定が入力されていません' };
  }

  try {
    // Force re-init to test with current settings
    lastConfigKey = '';
    const { auth } = await initFirebase(settings);
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return { success: false, error: '匿名認証に失敗しました。Firebaseコンソールで匿名認証を有効にしてください。' };
    }
    return { success: true };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/configuration-not-found' || code === 'auth/invalid-api-key') {
      return { success: false, error: 'APIキーが無効です。Firebase設定を確認してください。' };
    }
    if (code === 'auth/operation-not-allowed') {
      return { success: false, error: '匿名認証が無効です。Firebaseコンソールで有効にしてください。' };
    }
    if (code === 'auth/network-request-failed') {
      return { success: false, error: 'ネットワークエラー。インターネット接続を確認してください。' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : '接続に失敗しました',
    };
  }
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
