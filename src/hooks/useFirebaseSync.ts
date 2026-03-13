'use client';
import { useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { isFirebaseConfigured } from '../services/firebase';
import { loadFromFirestore, syncToFirestore } from '../services/firebaseSync';
import { SYNC_KEYS } from './useLocalStorage';
import { markSyncComplete } from './syncState';

const TIMESTAMP_PREFIX = 'stock-app-sync-ts-';

/** Keys whose data is an array of objects with `id` field — merge by id instead of replace */
const MERGEABLE_ARRAY_KEYS = new Set([
  'stock-app-memos',
  'stock-app-trades',
  'stock-app-watchlist',
  'stock-app-journal',
  'stock-app-trade-analysis',
  'stock-app-schedule-v5',
]);

function getLocalTimestamp(syncKey: string): number {
  try {
    return Number(localStorage.getItem(TIMESTAMP_PREFIX + syncKey)) || 0;
  } catch {
    return 0;
  }
}

/**
 * Merge two arrays by `id` field: union of both, preferring the item with the
 * later `updatedAt` (or `createdAt`) timestamp when duplicates exist.
 */
function mergeArraysById(local: unknown[], remote: unknown[]): unknown[] {
  const map = new Map<string, Record<string, unknown>>();

  const addItems = (items: unknown[]) => {
    for (const item of items) {
      if (typeof item !== 'object' || item === null || !('id' in item)) continue;
      const rec = item as Record<string, unknown>;
      const id = String(rec.id);
      const existing = map.get(id);
      if (!existing) {
        map.set(id, rec);
      } else {
        // Keep the one with the later updatedAt/createdAt
        const existingTs = String(existing.updatedAt || existing.createdAt || '');
        const newTs = String(rec.updatedAt || rec.createdAt || '');
        if (newTs > existingTs) {
          map.set(id, rec);
        }
      }
    }
  };

  addItems(local);
  addItems(remote);
  return Array.from(map.values());
}

/**
 * On app startup, loads all sync-eligible data from Firestore
 * and merges with localStorage using timestamp-based conflict resolution.
 * For array data (memos, trades, etc.), merges by ID to prevent data loss.
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

          // Parse local data
          let localParsed: unknown = null;
          try {
            const raw = localStorage.getItem(localKey);
            if (raw) localParsed = JSON.parse(raw);
          } catch { /* ignore */ }

          const localIsEmpty = localParsed == null
            || (Array.isArray(localParsed) && localParsed.length === 0)
            || (typeof localParsed === 'string' && localParsed.trim() === '');

          // For mergeable arrays, merge by ID instead of last-write-wins
          if (MERGEABLE_ARRAY_KEYS.has(localKey) && Array.isArray(localParsed) && remote && Array.isArray(remote.data)) {
            const merged = mergeArraysById(localParsed, remote.data as unknown[]);
            // Sort by updatedAt or createdAt descending (newest first)
            merged.sort((a, b) => {
              const aRec = a as Record<string, unknown>;
              const bRec = b as Record<string, unknown>;
              const aTs = String(aRec.updatedAt || aRec.createdAt || '');
              const bTs = String(bRec.updatedAt || bRec.createdAt || '');
              return bTs.localeCompare(aTs);
            });
            const mergedJson = JSON.stringify(merged);
            const localJson = JSON.stringify(localParsed);
            if (mergedJson !== localJson) {
              localStorage.setItem(localKey, mergedJson);
              anyUpdated = true;
            }
            // Push merged data to Firestore
            const now = Date.now();
            localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(now));
            await syncToFirestore(settings, syncKey, merged).catch(() => {});
            continue;
          }

          if (remote && remote.updatedAt > localTs) {
            // Firestore is newer — update localStorage
            localStorage.setItem(localKey, JSON.stringify(remote.data));
            localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(remote.updatedAt));
            anyUpdated = true;
          } else if (!remote || remote.updatedAt < localTs) {
            // Local is newer — push to Firestore
            if (localIsEmpty && remote) {
              // Local is empty but remote has data — prefer remote
              localStorage.setItem(localKey, JSON.stringify(remote.data));
              localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(remote.updatedAt));
              anyUpdated = true;
            } else if (!localIsEmpty && localParsed != null) {
              await syncToFirestore(settings, syncKey, localParsed);
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
