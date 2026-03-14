import { SYNC_KEYS } from '../hooks/useLocalStorage';
import { syncToFirestore } from './firebaseSync';
import { isFirebaseConfigured } from './firebase';

/** 設定を取得してFirestoreに同期 */
async function syncKeyToFirestore(localKey: string): Promise<void> {
  const syncKey = SYNC_KEYS[localKey];
  if (!syncKey) return;
  let settings;
  try { settings = JSON.parse(localStorage.getItem('stock-app-settings') || '{}'); }
  catch { return; }
  if (!isFirebaseConfigured(settings)) return;
  const raw = localStorage.getItem(localKey);
  if (!raw) return;
  try {
    await syncToFirestore(settings, syncKey, JSON.parse(raw));
  } catch { /* ignore */ }
}

/** プレースホルダー文字列の判定 */
export function isUploadingPlaceholder(src: string): boolean {
  return src.startsWith('__uploading__');
}

interface StrippedImage {
  placeholder: string;
  base64: string;
  localStorageKey: string;
}

/**
 * 同期的に全localStorage syncキーからbase64画像を除去。
 * プレースホルダーに置換し、除去したbase64のマニフェストを返す。
 */
export function emergencyFreeSpace(): StrippedImage[] {
  const manifest: StrippedImage[] = [];

  for (const localKey of Object.keys(SYNC_KEYS)) {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw || !raw.includes('data:image/')) continue;
      const data = JSON.parse(raw);
      let changed = false;

      if (Array.isArray(data)) {
        for (const item of data) {
          if (!item || typeof item !== 'object') continue;
          if (Array.isArray(item.images)) {
            for (let i = 0; i < item.images.length; i++) {
              if (typeof item.images[i] === 'string' && item.images[i].startsWith('data:image/')) {
                const placeholder = `__uploading__${crypto.randomUUID()}`;
                manifest.push({ placeholder, base64: item.images[i], localStorageKey: localKey });
                item.images[i] = placeholder;
                changed = true;
              }
            }
          }
          // WatchlistItem: events[].images
          if (Array.isArray(item.events)) {
            for (const evt of item.events) {
              if (Array.isArray(evt?.images)) {
                for (let i = 0; i < evt.images.length; i++) {
                  if (typeof evt.images[i] === 'string' && evt.images[i].startsWith('data:image/')) {
                    const placeholder = `__uploading__${crypto.randomUUID()}`;
                    manifest.push({ placeholder, base64: evt.images[i], localStorageKey: localKey });
                    evt.images[i] = placeholder;
                    changed = true;
                  }
                }
              }
            }
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        // Strategy: scenarioDescription.imageDataUrl
        if (data.scenarioDescription?.imageDataUrl?.startsWith('data:image/')) {
          const placeholder = `__uploading__${crypto.randomUUID()}`;
          manifest.push({ placeholder, base64: data.scenarioDescription.imageDataUrl, localStorageKey: localKey });
          data.scenarioDescription.imageDataUrl = placeholder;
          changed = true;
        }
        // VisionMap: images[].dataUrl
        if (Array.isArray(data.images)) {
          for (const img of data.images) {
            if (img?.dataUrl?.startsWith('data:image/')) {
              const placeholder = `__uploading__${crypto.randomUUID()}`;
              manifest.push({ placeholder, base64: img.dataUrl, localStorageKey: localKey });
              img.dataUrl = placeholder;
              changed = true;
            }
          }
        }
      }

      if (changed) localStorage.setItem(localKey, JSON.stringify(data));
    } catch { /* skip */ }
  }

  return manifest;
}

/**
 * 保存するデータからもbase64を除去。
 * 除去した画像のマニフェストと、除去済みデータを返す。
 */
export function stripBase64FromValue<T>(value: T): { stripped: T; images: StrippedImage[] } {
  const images: StrippedImage[] = [];
  const stripped = JSON.parse(JSON.stringify(value));

  if (Array.isArray(stripped)) {
    for (const item of stripped) {
      if (!item || typeof item !== 'object') continue;
      if (Array.isArray(item.images)) {
        for (let i = 0; i < item.images.length; i++) {
          if (typeof item.images[i] === 'string' && item.images[i].startsWith('data:image/')) {
            const placeholder = `__uploading__${crypto.randomUUID()}`;
            images.push({ placeholder, base64: item.images[i], localStorageKey: '' });
            item.images[i] = placeholder;
          }
        }
      }
      if (Array.isArray(item.events)) {
        for (const evt of item.events) {
          if (Array.isArray(evt?.images)) {
            for (let i = 0; i < evt.images.length; i++) {
              if (typeof evt.images[i] === 'string' && evt.images[i].startsWith('data:image/')) {
                const placeholder = `__uploading__${crypto.randomUUID()}`;
                images.push({ placeholder, base64: evt.images[i], localStorageKey: '' });
                evt.images[i] = placeholder;
              }
            }
          }
        }
      }
    }
  } else if (typeof stripped === 'object' && stripped !== null) {
    const obj = stripped as Record<string, unknown>;
    // Strategy
    const scenario = obj.scenarioDescription as Record<string, unknown> | undefined;
    if (scenario?.imageDataUrl && typeof scenario.imageDataUrl === 'string' && scenario.imageDataUrl.startsWith('data:image/')) {
      const placeholder = `__uploading__${crypto.randomUUID()}`;
      images.push({ placeholder, base64: scenario.imageDataUrl, localStorageKey: '' });
      scenario.imageDataUrl = placeholder;
    }
    // VisionMap
    if (Array.isArray(obj.images)) {
      for (const img of obj.images as Record<string, unknown>[]) {
        if (img?.dataUrl && typeof img.dataUrl === 'string' && img.dataUrl.startsWith('data:image/')) {
          const placeholder = `__uploading__${crypto.randomUUID()}`;
          images.push({ placeholder, base64: img.dataUrl, localStorageKey: '' });
          img.dataUrl = placeholder;
        }
      }
    }
  }

  return { stripped, images };
}

/**
 * マニフェスト内のbase64をFirebase Storageに並列アップロード。
 * 完了するたびにlocalStorageのプレースホルダーをURLで置換。
 */
export async function processUploadQueue(manifest: StrippedImage[]): Promise<void> {
  if (manifest.length === 0) return;
  const { migrateBase64ToStorage } = await import('./firebaseStorage');
  const { isFirebaseConfigured } = await import('./firebase');

  let settings;
  try { settings = JSON.parse(localStorage.getItem('stock-app-settings') || '{}'); }
  catch { return; }
  if (!isFirebaseConfigured(settings)) return;

  const CONCURRENCY = 5;
  for (let i = 0; i < manifest.length; i += CONCURRENCY) {
    const batch = manifest.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const url = await migrateBase64ToStorage(settings, item.base64);
        return { placeholder: item.placeholder, url };
      })
    );

    // バッチ完了ごとにlocalStorageを更新
    const replacements = new Map<string, string>();
    for (const r of results) {
      if (r.status === 'fulfilled') replacements.set(r.value.placeholder, r.value.url);
    }
    if (replacements.size > 0) replacePlaceholders(replacements);
  }
}

function replacePlaceholders(replacements: Map<string, string>): void {
  const changedKeys: string[] = [];
  for (const localKey of Object.keys(SYNC_KEYS)) {
    const raw = localStorage.getItem(localKey);
    if (!raw) continue;
    let updated = raw;
    for (const [placeholder, url] of replacements) {
      updated = updated.replaceAll(placeholder, url);
    }
    if (updated !== raw) {
      localStorage.setItem(localKey, updated);
      changedKeys.push(localKey);
    }
  }
  window.dispatchEvent(new Event('storage'));
  // Firestoreにも同期
  for (const key of changedKeys) {
    syncKeyToFirestore(key).catch(() => {});
  }
}

/**
 * 中断されたセッションで残った __uploading__ プレースホルダーを除去。
 * 該当画像エントリを配列から削除する。
 */
export function cleanupOrphanedPlaceholders(): string[] {
  const changedKeys: string[] = [];

  for (const localKey of Object.keys(SYNC_KEYS)) {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw || !raw.includes('__uploading__')) continue;
      const data = JSON.parse(raw);
      let changed = false;

      if (Array.isArray(data)) {
        for (const item of data) {
          if (!item || typeof item !== 'object') continue;
          if (Array.isArray(item.images)) {
            const filtered = item.images.filter((img: string) => !isUploadingPlaceholder(img));
            if (filtered.length !== item.images.length) {
              item.images = filtered;
              changed = true;
            }
          }
          if (Array.isArray(item.events)) {
            for (const evt of item.events) {
              if (Array.isArray(evt?.images)) {
                const filtered = evt.images.filter((img: string) => !isUploadingPlaceholder(img));
                if (filtered.length !== evt.images.length) {
                  evt.images = filtered;
                  changed = true;
                }
              }
            }
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        if (data.scenarioDescription?.imageDataUrl && isUploadingPlaceholder(data.scenarioDescription.imageDataUrl)) {
          delete data.scenarioDescription.imageDataUrl;
          changed = true;
        }
        if (Array.isArray(data.images)) {
          const filtered = data.images.filter((img: Record<string, unknown>) =>
            !(img?.dataUrl && typeof img.dataUrl === 'string' && isUploadingPlaceholder(img.dataUrl))
          );
          if (filtered.length !== data.images.length) {
            data.images = filtered;
            changed = true;
          }
        }
      }

      if (changed) {
        localStorage.setItem(localKey, JSON.stringify(data));
        changedKeys.push(localKey);
      }
    } catch { /* skip */ }
  }

  return changedKeys;
}
