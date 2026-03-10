/**
 * Generic Firebase Firestore sync service
 * Syncs localStorage data to Firestore for cross-device access
 */

import type { Settings } from '../types';
import { initFirebase, isFirebaseConfigured } from './firebase';

// Firestore path: artifacts/{appId}/users/{uid}/sync/{key}

const TIMEOUT_MS = 15000; // 15 seconds

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: ${ms / 1000}秒でタイムアウトしました。Firestoreデータベースが作成されているか、APIキー制限にCloud Firestore APIが含まれているか確認してください。`)), ms)
    ),
  ]);
}

export async function syncToFirestore(
  settings: Settings,
  key: string,
  data: unknown
): Promise<void> {
  if (!isFirebaseConfigured(settings)) {
    throw new Error('Firebase設定が入力されていません');
  }

  const { db, auth } = await initFirebase(settings);
  const { doc, setDoc } = await import('firebase/firestore');
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Firebase認証に失敗しました。匿名認証を有効にしてください。');
  }

  const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
  await withTimeout(
    setDoc(
      doc(db, 'artifacts', appId, 'users', uid, 'sync', key),
      {
        data: JSON.stringify(data),
        updatedAt: Date.now(),
      }
    ),
    TIMEOUT_MS,
    '保存'
  );
}

export async function loadFromFirestore<T>(
  settings: Settings,
  key: string
): Promise<{ data: T; updatedAt: number } | null> {
  if (!isFirebaseConfigured(settings)) {
    throw new Error('Firebase設定が入力されていません');
  }

  const { db, auth } = await initFirebase(settings);
  const { doc, getDoc } = await import('firebase/firestore');
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Firebase認証に失敗しました。匿名認証を有効にしてください。');
  }

  const appId = settings.firebaseAppId || 'rakuten-asset-tracker-v4';
  const snap = await withTimeout(
    getDoc(
      doc(db, 'artifacts', appId, 'users', uid, 'sync', key)
    ),
    TIMEOUT_MS,
    '読込'
  );

  if (!snap.exists()) return null;

  const docData = snap.data();
  return {
    data: JSON.parse(docData.data) as T,
    updatedAt: docData.updatedAt ?? 0,
  };
}
