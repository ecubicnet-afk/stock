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
    }, 5000);
  };

  const saveAll = useCallback(async () => {
    if (!isFirebaseConfigured(settings)) {
      setStatus(s => ({ ...s, result: 'error', error: 'Firebase設定が未入力です。設定画面で入力してください。' }));
      clearResult();
      return;
    }
    setStatus(s => ({ ...s, isSaving: true, result: null, error: null }));

    try {
      const entries = Object.entries(SYNC_KEYS);
      const now = Date.now();
      let successCount = 0;
      const errors: string[] = [];

      await Promise.all(
        entries.map(async ([localKey, syncKey]) => {
          const raw = localStorage.getItem(localKey);
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            await syncToFirestore(settings, syncKey, parsed);
            localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(now));
            successCount++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : `${syncKey}の保存に失敗`;
            errors.push(msg);
          }
        })
      );

      setStatus(s => ({ ...s, isSaving: false, lastSavedAt: now, result: null }));

      if (errors.length > 0 && successCount === 0) {
        alert(`保存エラー: ${errors[0]}`);
      } else if (errors.length > 0) {
        alert(`${successCount}件保存、${errors.length}件失敗\n${errors[0]}`);
      } else if (successCount === 0) {
        alert('保存するデータがありませんでした。');
      } else {
        alert(`${successCount}件のデータをクラウドに保存しました。`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      setStatus(s => ({ ...s, isSaving: false, result: 'error', error: msg }));
      clearResult();
    }
  }, [settings]);

  const loadAll = useCallback(async () => {
    if (!isFirebaseConfigured(settings)) {
      alert('Firebase設定が未入力です。設定画面で入力してください。');
      return;
    }
    setStatus(s => ({ ...s, isLoading: true, result: null, error: null }));

    try {
      const entries = Object.entries(SYNC_KEYS);
      let loadCount = 0;
      const errors: string[] = [];

      await Promise.all(
        entries.map(async ([localKey, syncKey]) => {
          try {
            const remote = await loadFromFirestore<unknown>(settings, syncKey);
            if (remote) {
              localStorage.setItem(localKey, JSON.stringify(remote.data));
              localStorage.setItem(TIMESTAMP_PREFIX + syncKey, String(remote.updatedAt));
              loadCount++;
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : `${syncKey}の読込に失敗`;
            errors.push(msg);
          }
        })
      );

      setStatus(s => ({ ...s, isLoading: false, lastLoadedAt: Date.now(), result: null }));

      if (errors.length > 0) {
        alert(`読込エラー: ${errors[0]}`);
      } else if (loadCount === 0) {
        alert('クラウドにデータが見つかりませんでした。\n先に「クラウドに保存」を実行してください。');
      } else {
        alert(`${loadCount}件のデータをクラウドから読み込みました。\nページをリロードして反映します。`);
        window.location.reload();
        return;
      }
    } catch (err) {
      setStatus(s => ({ ...s, isLoading: false, result: null }));
      const msg = err instanceof Error ? err.message : '読込に失敗しました';
      alert(`読込エラー: ${msg}`);
    }
  }, [settings]);

  return {
    syncStatus: status,
    saveAll,
    loadAll,
    isConfigured: isFirebaseConfigured(settings),
  };
}
