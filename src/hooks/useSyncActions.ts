import { useState, useCallback, useRef } from 'react';
import { useSettings } from './useSettings';
import { isFirebaseConfigured } from '../services/firebase';
import { syncToFirestore, loadFromFirestore } from '../services/firebaseSync';
import { SYNC_KEYS, TIMESTAMP_PREFIX } from './useLocalStorage';

interface SyncStatus {
  isSaving: boolean;
  isLoading: boolean;
  lastSavedAt: number | null;
  lastLoadedAt: number | null;
  result: 'success' | 'error' | null;
  error: string | null;
}

export function useSyncActions() {
  const { settings } = useSettings();
  const [status, setStatus] = useState<SyncStatus>({
    isSaving: false,
    isLoading: false,
    lastSavedAt: null,
    lastLoadedAt: null,
    result: null,
    error: null,
  });
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearResult = () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setStatus(s => ({ ...s, result: null, error: null }));
    }, 3000);
  };

  const saveAll = useCallback(async () => {
    if (!isFirebaseConfigured(settings)) return;
    setStatus(s => ({ ...s, isSaving: true, result: null, error: null }));

    try {
      const entries = Object.entries(SYNC_KEYS);
      const now = Date.now();

      await Promise.all(
        entries.map(async ([localKey, syncKey]) => {
          const raw = localStorage.getItem(localKey);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          await syncToFirestore(settings, syncKey, parsed);
          localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(now));
        })
      );

      setStatus(s => ({ ...s, isSaving: false, lastSavedAt: now, result: 'success' }));
      clearResult();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      setStatus(s => ({ ...s, isSaving: false, result: 'error', error: msg }));
      clearResult();
    }
  }, [settings]);

  const loadAll = useCallback(async () => {
    if (!isFirebaseConfigured(settings)) return;
    setStatus(s => ({ ...s, isLoading: true, result: null, error: null }));

    try {
      const entries = Object.entries(SYNC_KEYS);
      let anyUpdated = false;

      await Promise.all(
        entries.map(async ([localKey, syncKey]) => {
          const remote = await loadFromFirestore<unknown>(settings, syncKey);
          if (remote) {
            localStorage.setItem(localKey, JSON.stringify(remote.data));
            localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(remote.updatedAt));
            anyUpdated = true;
          }
        })
      );

      if (anyUpdated) {
        window.dispatchEvent(new Event('storage'));
      }

      const now = Date.now();
      setStatus(s => ({ ...s, isLoading: false, lastLoadedAt: now, result: 'success' }));
      clearResult();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '読込に失敗しました';
      setStatus(s => ({ ...s, isLoading: false, result: 'error', error: msg }));
      clearResult();
    }
  }, [settings]);

  return {
    syncStatus: status,
    saveAll,
    loadAll,
    isConfigured: isFirebaseConfigured(settings),
  };
}
