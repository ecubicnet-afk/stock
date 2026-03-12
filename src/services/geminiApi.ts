// --- Gemini API client via Next.js Route Handlers ---
// All Gemini calls go through /api/gemini/* server-side proxy.
// API keys are never sent to the browser.

/**
 * 共通Gemini呼び出し（サーバーサイドプロキシ経由）
 */
export async function callGemini(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      maxTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return data.text;
}

// --- Sector Classification ---

const SECTOR_CACHE_KEY = 'stock-app-sector-cache';

interface SectorCacheEntry {
  sector: string;
  timestamp: number;
}

function getSectorCache(): Record<string, SectorCacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(SECTOR_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setSectorCache(cache: Record<string, SectorCacheEntry>) {
  localStorage.setItem(SECTOR_CACHE_KEY, JSON.stringify(cache));
}

/**
 * Gemini AIでセクター分類を取得（サーバーサイドプロキシ経由・キャッシュ付き）
 */
export async function fetchSectorClassification(
  stockCodes: string[]
): Promise<Record<string, string>> {
  const cache = getSectorCache();
  const now = Date.now();
  const TTL = 7 * 24 * 60 * 60 * 1000; // 7日

  const result: Record<string, string> = {};
  const uncached: string[] = [];
  for (const code of stockCodes) {
    const cached = cache[code];
    if (cached && now - cached.timestamp < TTL) {
      result[code] = cached.sector;
    } else {
      uncached.push(code);
    }
  }

  if (uncached.length === 0) return result;

  const res = await fetch('/api/gemini/sector', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stockCodes: uncached }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Sector API error: ${res.status}`);
  }

  const parsed = await res.json();

  const newCache = { ...cache };
  for (const s of parsed.stocks) {
    const code = String(s.code);
    result[code] = s.sector;
    newCache[code] = { sector: s.sector, timestamp: now };
  }
  setSectorCache(newCache);

  return result;
}

/**
 * Gemini AIで市場指数のヒストリカルデータを取得（サーバーサイドプロキシ経由）
 */
export async function fetchIndexData(
  dates: string[]
): Promise<Record<string, { n225: number; topix: number }>> {
  const res = await fetch('/api/gemini/index-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dates }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Index data API error: ${res.status}`);
  }

  const parsed = await res.json();
  const result: Record<string, { n225: number; topix: number }> = {};
  for (const d of parsed.data) {
    result[d.date] = { n225: d.n225, topix: d.topix };
  }
  return result;
}
