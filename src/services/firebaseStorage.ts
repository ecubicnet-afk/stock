/**
 * Firebase Storage service for image uploads
 * Stores images in Firebase Storage instead of base64 in localStorage/Firestore documents
 */

import type { Settings } from '../types';
import { initFirebase, isFirebaseConfigured } from './firebase';

// Cache dynamic imports for parallel upload performance
let storageModuleCache: {
  ref: typeof import('firebase/storage').ref;
  uploadBytes: typeof import('firebase/storage').uploadBytes;
  getDownloadURL: typeof import('firebase/storage').getDownloadURL;
} | null = null;

async function getStorageModule() {
  if (!storageModuleCache) {
    const mod = await import('firebase/storage');
    storageModuleCache = { ref: mod.ref, uploadBytes: mod.uploadBytes, getDownloadURL: mod.getDownloadURL };
  }
  return storageModuleCache;
}

const withTimeout = <T>(p: Promise<T>, ms = 30000) => Promise.race([
  p,
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('アップロードがタイムアウトしました（30秒）')), ms)
  ),
]);

/**
 * Upload an image blob to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadImage(
  settings: Settings,
  blob: Blob,
  imageId?: string,
): Promise<string> {
  if (!isFirebaseConfigured(settings)) {
    throw new Error('Firebase設定が入力されていません');
  }

  const { storage, auth } = await initFirebase(settings);
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Firebase認証に失敗しました');
  }

  const id = imageId || crypto.randomUUID();
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const contentType = blob.type || 'image/jpeg';
  const { ref, uploadBytes, getDownloadURL } = await getStorageModule();
  const storageRef = ref(storage, `users/${uid}/images/${id}.${ext}`);

  await withTimeout(uploadBytes(storageRef, blob, { contentType }));
  return withTimeout(getDownloadURL(storageRef));
}

/**
 * Delete an image from Firebase Storage by its download URL.
 * Best-effort: errors are logged but not thrown.
 */
export async function deleteImage(
  settings: Settings,
  downloadUrl: string,
): Promise<void> {
  if (!isFirebaseConfigured(settings)) return;

  try {
    const { storage } = await initFirebase(settings);
    const { ref } = await getStorageModule();
    const { deleteObject } = await import('firebase/storage');
    // Extract the storage path from the download URL
    const url = new URL(downloadUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (!pathMatch) return;
    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.error('[FirebaseStorage] Delete failed:', err);
  }
}

/** Check if a string is a Firebase Storage download URL (vs a base64 data URL) */
export function isStorageUrl(value: string): boolean {
  return value.startsWith('https://firebasestorage.googleapis.com/')
    || value.startsWith('https://storage.googleapis.com/');
}

/** Check if a string is a base64 data URL */
export function isBase64DataUrl(value: string): boolean {
  return value.startsWith('data:image/');
}

/**
 * Convert a base64 data URL to a Blob and upload to Firebase Storage.
 * Used to migrate old base64 images stored in localStorage/Firestore.
 */
export async function migrateBase64ToStorage(
  settings: Settings,
  dataUrl: string,
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return uploadImage(settings, blob);
}
