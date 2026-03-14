'use client';
import { useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { isFirebaseConfigured } from '../services/firebase';
import { loadFromFirestore, syncToFirestore } from '../services/firebaseSync';
import { SYNC_KEYS } from './useLocalStorage';
import { markSyncComplete } from './syncState';
import type { Settings } from '../types';

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
 * Migrate base64 data URLs in localStorage to Firebase Storage URLs.
 * Runs once after sync to free up localStorage/Firestore space.
 */
async function migrateBase64Images(settings: Settings): Promise<boolean> {
  const { migrateBase64ToStorage, isBase64DataUrl } = await import('../services/firebaseStorage');
  let anyMigrated = false;

  async function migrateImageArray(images: string[]): Promise<boolean> {
    let changed = false;
    for (let i = 0; i < images.length; i++) {
      if (isBase64DataUrl(images[i])) {
        try {
          images[i] = await migrateBase64ToStorage(settings, images[i]);
          changed = true;
        } catch { /* retry next time */ }
      }
    }
    return changed;
  }

  // Process all sync keys that may contain base64 images
  for (const [localKey, syncKey] of Object.entries(SYNC_KEYS)) {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) continue;
      const data = JSON.parse(raw);
      let migrated = false;

      if (Array.isArray(data)) {
        // Array data: memos, trades, journal, schedule, trade-methods, watchlist
        for (const item of data) {
          if (!item || typeof item !== 'object') continue;
          if (Array.isArray(item.images) && await migrateImageArray(item.images)) migrated = true;
          // WatchlistItem: nested events[].images
          if (Array.isArray(item.events)) {
            for (const evt of item.events) {
              if (evt?.images && await migrateImageArray(evt.images)) migrated = true;
            }
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        // Strategy: scenarioDescription.imageDataUrl
        if (data.scenarioDescription?.imageDataUrl && isBase64DataUrl(data.scenarioDescription.imageDataUrl)) {
          try {
            data.scenarioDescription.imageDataUrl = await migrateBase64ToStorage(settings, data.scenarioDescription.imageDataUrl);
            migrated = true;
          } catch { /* retry next time */ }
        }
        // VisionMap: images[].dataUrl
        if (Array.isArray(data.images)) {
          for (const img of data.images) {
            if (img?.dataUrl && isBase64DataUrl(img.dataUrl)) {
              try {
                img.dataUrl = await migrateBase64ToStorage(settings, img.dataUrl);
                migrated = true;
              } catch { /* retry next time */ }
            }
          }
        }
      }

      if (migrated) {
        localStorage.setItem(localKey, JSON.stringify(data));
        await syncToFirestore(settings, syncKey, data).catch(() => {});
        anyMigrated = true;
      }
    } catch {
      // Parse error or other issue — skip this key
    }
  }

  return anyMigrated;
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

      // Migrate any remaining base64 images to Firebase Storage (non-blocking)
      if (!hasFatalError) {
        migrateBase64Images(settings).then((migrated) => {
          if (migrated) window.dispatchEvent(new Event('storage'));
        }).catch(() => {});
      }
    })();
  }, [settings]);
}
