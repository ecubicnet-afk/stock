/**
 * Firebase Storage service for image uploads
 * Stores images in Firebase Storage instead of base64 in localStorage/Firestore documents
 */

import type { Settings } from '../types';
import { initFirebase, isFirebaseConfigured } from './firebase';

/**
 * Upload a compressed image blob to Firebase Storage.
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
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const storageRef = ref(storage, `users/${uid}/images/${id}.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
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
    const { ref, deleteObject } = await import('firebase/storage');
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
