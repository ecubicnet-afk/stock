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
 * Gemini AIでセクター分類を取得（キャッシュ付き）
 */
export async function fetchSectorClassification(
  stockCodes: string[],
  apiKey: string
): Promise<Record<string, string>> {
  const cache = getSectorCache();
  const now = Date.now();
  const TTL = 7 * 24 * 60 * 60 * 1000; // 7日

  // キャッシュから取得可能なものを分離
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

  const prompt = `以下の日本株の銘柄コードの「東証33業種」を教えて。JSON形式 { "stocks": [ { "code": "1605", "sector": "鉱業" }, ... ] } で返して。リスト: ${uncached.join(', ')}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  const data = await resp.json();
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text);

  // キャッシュ更新
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
 * Gemini AIで市場指数のヒストリカルデータを取得
 */
export async function fetchIndexData(
  dates: string[],
  apiKey: string
): Promise<Record<string, { n225: number; topix: number }>> {
  const prompt = `以下の日付リストの日経平均株価(N225)とTOPIX終値をJSON形式で教えて。土日祝の場合は直前の営業日を採用して。{ "data": [ { "date": "2026-02-26", "n225": 39500.25, "topix": 2700.50 }, ... ] } リスト: ${dates.join(', ')}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  const data = await resp.json();
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
  const result: Record<string, { n225: number; topix: number }> = {};
  for (const d of parsed.data) {
    result[d.date] = { n225: d.n225, topix: d.topix };
  }
  return result;
}
