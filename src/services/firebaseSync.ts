/**
 * Generic Firebase Firestore sync service
 * Syncs localStorage data to Firestore for cross-device access
 */

import type { Settings } from '../types';
import { initFirebase, isFirebaseConfigured } from './firebase';

// Firestore path: artifacts/{appId}/users/{uid}/sync/{key}

export async function syncToFirestore(
  settings: Settings,
  key: string,
  data: unknown
): Promise<void> {
  if (!isFirebaseConfigured(settings)) return;

  try {
    const { db, auth } = await initFirebase(settings);
    const { doc, setDoc } = await import('firebase/firestore');
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
    await setDoc(
      doc(db, 'artifacts', appId, 'users', uid, 'sync', key),
      {
        data: JSON.stringify(data),
        updatedAt: Date.now(),
      }
    );
  } catch (err) {
    console.error(`[FirebaseSync] Failed to sync "${key}" to Firestore:`, err);
  }
}

export async function loadFromFirestore<T>(
  settings: Settings,
  key: string
): Promise<{ data: T; updatedAt: number } | null> {
  if (!isFirebaseConfigured(settings)) return null;

  try {
    const { db, auth } = await initFirebase(settings);
    const { doc, getDoc } = await import('firebase/firestore');
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
    const snap = await getDoc(
      doc(db, 'artifacts', appId, 'users', uid, 'sync', key)
    );

    if (!snap.exists()) return null;

    const docData = snap.data();
    return {
      data: JSON.parse(docData.data) as T,
      updatedAt: docData.updatedAt ?? 0,
    };
  } catch (err) {
    console.error(`[FirebaseSync] Failed to load "${key}" from Firestore:`, err);
    return null;
  }
}
