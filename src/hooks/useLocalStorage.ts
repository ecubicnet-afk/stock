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
    const now = Date.now();
    localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(now));
    syncToFirestore(settings, syncKey, data).catch(() => {});
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
      } catch {
        // ignore quota errors
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
