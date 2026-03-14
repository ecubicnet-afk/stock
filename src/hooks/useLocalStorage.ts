'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { syncToFirestore } from '../services/firebaseSync';
import { isFirebaseConfigured } from '../services/firebase';
import { initialSyncComplete } from './syncState';

/** Mapping from localStorage key to Firestore sync key */
export const SYNC_KEYS: Record<string, string> = {
  'stock-app-sidebar-todos': 'todos',
  'stock-app-sidebar-principles': 'principles',
  'stock-app-schedule-v5': 'schedule',
  'stock-app-strategy': 'strategy',
  'stock-app-trades': 'trades',
  'stock-app-watchlist': 'watchlist',
  'stock-app-trade-analysis': 'trade-analysis',
  'stock-app-trade-files': 'trade-files',
  'stock-app-memos': 'memos',
  'stock-app-journal': 'journal',
  'stock-app-portfolio': 'portfolio',
  'stock-app-vision-map': 'vision-map',
  'stock-app-assignments': 'assignments',
  'stock-app-trade-methods': 'trade-methods',
};

export const TIMESTAMP_PREFIX = 'stock-app-sync-ts-';

// Debounce timers per key
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleSync(localKey: string, data: unknown) {
  const syncKey = SYNC_KEYS[localKey];
  if (!syncKey) return;

  // Don't push to Firestore until initial sync is done (prevents empty-device overwrite)
  if (!initialSyncComplete) return;

  // Read settings from localStorage (avoid circular hook dependency)
  let settings;
  try {
    settings = JSON.parse(localStorage.getItem('stock-app-settings') || '{}');
  } catch {
    return;
  }
  if (!isFirebaseConfigured(settings)) return;

  // Debounce: only sync after 500ms of inactivity
  clearTimeout(debounceTimers[localKey]);
  debounceTimers[localKey] = setTimeout(() => {
    syncToFirestore(settings, syncKey, data)
      .then(() => {
        // Only update timestamp after successful sync
        const now = Date.now();
        localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(now));
      })
      .catch(() => {});
  }, 500);
}

/**
 * Migrate base64 images in data to Firebase Storage URLs, then retry localStorage save.
 * Returns the cleaned data if successful, null if migration failed or not applicable.
 */
async function migrateAndRetry(key: string, data: unknown): Promise<unknown | null> {
  const { migrateBase64ToStorage, isBase64DataUrl } = await import('../services/firebaseStorage');

  let settings;
  try {
    settings = JSON.parse(localStorage.getItem('stock-app-settings') || '{}');
  } catch { return null; }
  if (!isFirebaseConfigured(settings)) return null;

  let migrated = false;
  const cloned = JSON.parse(JSON.stringify(data));

  if (Array.isArray(cloned)) {
    for (const item of cloned) {
      if (!item || typeof item !== 'object') continue;
      // images: string[] field (memos, trades, journal, schedule, trade-methods)
      if (Array.isArray(item.images)) {
        for (let i = 0; i < item.images.length; i++) {
          if (isBase64DataUrl(item.images[i])) {
            try {
              item.images[i] = await migrateBase64ToStorage(settings, item.images[i]);
              migrated = true;
            } catch { /* skip this image */ }
          }
        }
      }
      // WatchlistItem: events[].images
      if (Array.isArray(item.events)) {
        for (const evt of item.events) {
          if (evt?.images && Array.isArray(evt.images)) {
            for (let i = 0; i < evt.images.length; i++) {
              if (isBase64DataUrl(evt.images[i])) {
                try {
                  evt.images[i] = await migrateBase64ToStorage(settings, evt.images[i]);
                  migrated = true;
                } catch { /* skip */ }
              }
            }
          }
        }
      }
    }
  } else if (typeof cloned === 'object' && cloned !== null) {
    // Strategy: scenarioDescription.imageDataUrl
    if (cloned.scenarioDescription?.imageDataUrl && isBase64DataUrl(cloned.scenarioDescription.imageDataUrl)) {
      try {
        cloned.scenarioDescription.imageDataUrl = await migrateBase64ToStorage(settings, cloned.scenarioDescription.imageDataUrl);
        migrated = true;
      } catch { /* skip */ }
    }
    // VisionMap: images[].dataUrl
    if (Array.isArray(cloned.images)) {
      for (const img of cloned.images) {
        if (img?.dataUrl && isBase64DataUrl(img.dataUrl)) {
          try {
            img.dataUrl = await migrateBase64ToStorage(settings, img.dataUrl);
            migrated = true;
          } catch { /* skip */ }
        }
      }
    }
  }

  if (!migrated) return null;

  try {
    window.localStorage.setItem(key, JSON.stringify(cloned));
    scheduleSync(key, cloned);
    return cloned;
  } catch {
    return null;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Track whether a migration retry is in progress
  const migrating = useRef(false);

  // Listen for storage events (from useFirebaseSync or other tabs)
  useEffect(() => {
    const handler = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item) as T);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
        scheduleSync(key, newValue);
      } catch (err) {
        if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
          // Background: migrate base64 images to Firebase Storage and retry
          if (!migrating.current) {
            migrating.current = true;
            migrateAndRetry(key, newValue).then((cleaned) => {
              if (cleaned) {
                setStoredValue(cleaned as T);
                window.dispatchEvent(new Event('storage'));
              } else {
                window.dispatchEvent(new CustomEvent('storage-quota-error', {
                  detail: { key, message: 'ストレージ容量が不足しています。古いメモや画像を削除してください。' },
                }));
              }
            }).catch(() => {
              window.dispatchEvent(new CustomEvent('storage-quota-error', {
                detail: { key, message: 'ストレージ容量が不足しています。古いメモや画像を削除してください。' },
              }));
            }).finally(() => {
              migrating.current = false;
            });
          }
        } else {
          console.error(`[localStorage] Save failed for "${key}":`, err);
        }
        // Revert React state to match localStorage (save failed, retry in background)
        return prev;
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
