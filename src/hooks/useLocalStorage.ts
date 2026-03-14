'use client';
import { useState, useCallback, useEffect } from 'react';
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

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

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
        console.error(`[localStorage] Save failed for "${key}":`, err);
        // Show user-visible warning for quota errors
        if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
          window.dispatchEvent(new CustomEvent('storage-quota-error', {
            detail: { key, message: 'ストレージ容量が不足しています。古いメモや画像を削除してください。' },
          }));
        }
        // Revert React state to match localStorage (save failed)
        return prev;
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
