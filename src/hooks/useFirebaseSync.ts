import { useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { isFirebaseConfigured } from '../services/firebase';
import { loadFromFirestore, syncToFirestore } from '../services/firebaseSync';
import { SYNC_KEYS } from './useLocalStorage';
import { markSyncComplete } from './syncState';

const TIMESTAMP_PREFIX = 'stock-app-sync-ts-';

function getLocalTimestamp(syncKey: string): number {
  try {
    return Number(localStorage.getItem(TIMESTAMP_PREFIX + syncKey)) || 0;
  } catch {
    return 0;
  }
}

/**
 * On app startup, loads all sync-eligible data from Firestore
 * and merges with localStorage using timestamp-based conflict resolution.
 */
export function useFirebaseSync() {
  const { settings } = useSettings();
  const didSync = useRef(false);

  useEffect(() => {
    if (didSync.current) return;
    if (!isFirebaseConfigured(settings)) return;
    didSync.current = true;

    (async () => {
      let anyUpdated = false;
      let hasFatalError = false;

      for (const [localKey, syncKey] of Object.entries(SYNC_KEYS)) {
        try {
          const remote = await loadFromFirestore<unknown>(settings, syncKey);
          const localTs = getLocalTimestamp(syncKey);

          if (remote && remote.updatedAt > localTs) {
            // Firestore is newer — update localStorage
            localStorage.setItem(localKey, JSON.stringify(remote.data));
            localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(remote.updatedAt));
            anyUpdated = true;
          } else if (!remote || remote.updatedAt < localTs) {
            // Local is newer — push to Firestore
            const localData = localStorage.getItem(localKey);
            if (localData) {
              const parsed = JSON.parse(localData);
              // Don't overwrite remote with empty data
              const isEmpty = Array.isArray(parsed) ? parsed.length === 0
                : typeof parsed === 'string' ? parsed.trim() === ''
                : !parsed;
              if (isEmpty && remote) {
                // Local is empty but remote has data — prefer remote
                localStorage.setItem(localKey, JSON.stringify(remote.data));
                localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(remote.updatedAt));
                anyUpdated = true;
              } else if (!isEmpty) {
                await syncToFirestore(settings, syncKey, parsed);
              }
            }
          }
        } catch (err) {
          console.error(`[FirebaseSync] Startup sync error for "${syncKey}":`, err);
          hasFatalError = true;
          break; // Auth/config error — no point trying other keys
        }
      }

      if (hasFatalError) {
        // Allow retry on next settings change
        didSync.current = false;
      }

      markSyncComplete();

      if (anyUpdated) {
        // Notify React hooks that localStorage changed
        window.dispatchEvent(new Event('storage'));
      }
    })();
  }, [settings]);
}
