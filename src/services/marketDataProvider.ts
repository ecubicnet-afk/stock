import type { MarketItem, SubIndicator, DataPoint } from '../types';
import { fetchCryptoData, fetchForexData, fetchFmpIndices, fetchFmpCommodities, fetchFmpSparklines, fetchFmpSubIndicators } from './api';
import { getCached, setCache } from './apiCache';
import {
  mockIndices,
  mockForex,
  mockCommodities,
  mockCrypto,
  mockSubIndicators,
  mockFearGreed,
  mockMarketSummary,
} from './mockData';

const CRYPTO_TTL = 60_000;
const FOREX_TTL = 300_000;
const FMP_TTL = 300_000; // 5min — シンボル削減により頻度UP可能
const SPARKLINE_TTL = 3_600_000; // 1時間 — 空結果はキャッシュしないので短めに
const SUB_TTL = 300_000; // 5min

export interface FetchResult {
  indices: MarketItem[];
  forex: MarketItem[];
  commodities: MarketItem[];
  crypto: MarketItem[];
  subIndicators: SubIndicator[];
  fearGreed: typeof mockFearGreed;
  marketSummary: typeof mockMarketSummary;
  lastUpdated: string;
  fmpStatus: 'not-configured' | 'partial' | 'failed';
}

// VIXからFear & Greedスコアを算出
function vixToFearGreed(vix: number): { value: number; label: string } {
  if (vix <= 12) return { value: 85, label: 'Extreme Greed' };
  if (vix <= 18) return { value: 70, label: 'Greed' };
  if (vix <= 25) return { value: 50, label: 'Neutral' };
  if (vix <= 35) return { value: 25, label: 'Fear' };
  return { value: 10, label: 'Extreme Fear' };
}

// 既存データから算出可能なサブ指標を生成
function computeDerivedIndicators(
  indices: MarketItem[],
  forex: MarketItem[],
  liveSubIndicators: SubIndicator[]
): SubIndicator[] {
  const derived: SubIndicator[] = [];

  const nikkei = indices.find((i) => i.id === 'nikkei225');
  const topix = indices.find((i) => i.id === 'topix');
  const usdjpy = forex.find((i) => i.id === 'usdjpy');
  const us10y = liveSubIndicators.find((i) => i.id === 'us10y');

  // NT倍率
  if (nikkei && topix && topix.currentValue > 0) {
    const ntRatio = nikkei.currentValue / topix.currentValue;
    const prevNt = nikkei.previousClose / topix.previousClose;
    const ntChange = ntRatio - prevNt;
    derived.push({
      id: 'nt-ratio',
      name: 'NT Ratio',
      nameJa: 'NT倍率',
      category: 'other',
      value: Math.round(ntRatio * 100) / 100,
      change: Math.round(ntChange * 100) / 100,
      changePercent: Math.round((ntChange / prevNt) * 10000) / 100,
      unit: '倍',
      signal: 'neutral',
      dataSource: 'live',
    });
  }

  // ドル建て日経平均
  if (nikkei && usdjpy && usdjpy.currentValue > 0) {
    const nikkeiUsd = nikkei.currentValue / usdjpy.currentValue;
    const prevNikkeiUsd = nikkei.previousClose / (usdjpy.previousClose || usdjpy.currentValue);
    const nikkeiUsdChange = nikkeiUsd - prevNikkeiUsd;
    derived.push({
      id: 'nikkei-usd',
      name: 'Nikkei USD',
      nameJa: 'ドル建て日経平均',
      category: 'other',
      value: Math.round(nikkeiUsd * 100) / 100,
      change: Math.round(nikkeiUsdChange * 100) / 100,
      changePercent: Math.round((nikkeiUsdChange / prevNikkeiUsd) * 10000) / 100,
      unit: 'USD',
      signal: nikkeiUsdChange < -5 ? 'bearish' : nikkeiUsdChange > 5 ? 'bullish' : 'neutral',
      dataSource: 'live',
    });
  }

  // 日米金利差（jp10yはモック値を利用）
  if (us10y) {
    const jp10yMock = mockSubIndicators.find((i) => i.id === 'jp10y');
    if (jp10yMock) {
      const spread = us10y.value - jp10yMock.value;
      const prevSpread = (us10y.value - us10y.change) - jp10yMock.value;
      const spreadChange = spread - prevSpread;
      derived.push({
        id: 'rate-spread',
        name: 'US-JP Spread',
        nameJa: '日米金利差',
        category: 'bonds',
        value: Math.round(spread * 1000) / 1000,
        change: Math.round(spreadChange * 1000) / 1000,
        changePercent: prevSpread !== 0 ? Math.round((spreadChange / Math.abs(prevSpread)) * 10000) / 100 : 0,
        unit: '%',
        signal: 'neutral',
        dataSource: 'live',
      });
    }
  }

  return derived;
}

export async function fetchAllMarketData(dataSource: 'auto' | 'mock', fmpApiKey?: string): Promise<FetchResult> {
  if (dataSource === 'mock') {
    return {
      indices: mockIndices,
      forex: mockForex,
      commodities: mockCommodities,
      crypto: mockCrypto,
      subIndicators: mockSubIndicators,
      fearGreed: mockFearGreed,
      marketSummary: mockMarketSummary,
      lastUpdated: new Date().toISOString(),
      fmpStatus: 'not-configured',
    };
  }

  try {
  const [cryptoResult, forexResult] = await Promise.allSettled([
    (async () => {
      const cached = getCached<MarketItem[]>('crypto', CRYPTO_TTL);
      if (cached) return cached;
      const data = await fetchCryptoData();
      setCache('crypto', data);
      return data;
    })(),
    (async () => {
      const cached = getCached<MarketItem[]>('forex', FOREX_TTL);
      if (cached) return cached;
      const data = await fetchForexData();
      setCache('forex', data);
      return data;
    })(),
  ]);

  const crypto = cryptoResult.status === 'fulfilled' ? cryptoResult.value : mockCrypto;
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : mockForex;

  // FMP API: indices, commodities, sparklines, sub-indicators
  // デフォルトはモック — dataSource: 'mock' を必ず付与してフィルタ対象にする
  let indices: MarketItem[] = mockIndices.map((m) => ({ ...m, dataSource: 'mock' as const }));
  let commodities: MarketItem[] = mockCommodities.map((m) => ({ ...m, dataSource: 'mock' as const }));
  let subIndicators: SubIndicator[] = mockSubIndicators.map((m) => ({ ...m, dataSource: 'mock' as const }));
  let fearGreed = mockFearGreed;
  let fmpStatus: FetchResult['fmpStatus'] = 'not-configured';

  if (fmpApiKey) {
    // スパークラインデータ（12時間キャッシュ）
    let sparklineMap = getCached<Record<string, DataPoint[]>>('fmp-sparklines', SPARKLINE_TTL);
    if (!sparklineMap) {
      try {
        sparklineMap = await fetchFmpSparklines(fmpApiKey);
        if (Object.keys(sparklineMap).length > 0) {
          setCache('fmp-sparklines', sparklineMap);
        }
      } catch {
        sparklineMap = {};
      }
    }

    const [indicesResult, commoditiesResult, subResult] = await Promise.allSettled([
      (async () => {
        const cached = getCached<MarketItem[]>('fmp-indices', FMP_TTL);
        if (cached) return cached;
        try {
          const data = await fetchFmpIndices(fmpApiKey, sparklineMap ?? undefined);
          if (data.length > 0) setCache('fmp-indices', data);
          console.info(`[FMP] Indices: ${data.length} items fetched`);
          return data;
        } catch (err) {
          console.warn('[FMP] Indices fetch failed:', err);
          return [];
        }
      })(),
      (async () => {
        const cached = getCached<MarketItem[]>('fmp-commodities', FMP_TTL);
        if (cached) return cached;
        try {
          const data = await fetchFmpCommodities(fmpApiKey, sparklineMap ?? undefined);
          if (data.length > 0) setCache('fmp-commodities', data);
          console.info(`[FMP] Commodities: ${data.length} items fetched`);
          return data;
        } catch (err) {
          console.warn('[FMP] Commodities fetch failed:', err);
          return [];
        }
      })(),
      (async () => {
        const cached = getCached<SubIndicator[]>('fmp-sub', SUB_TTL);
        if (cached) return cached;
        try {
          const data = await fetchFmpSubIndicators(fmpApiKey);
          if (data.length > 0) setCache('fmp-sub', data);
          console.info(`[FMP] SubIndicators: ${data.length} items fetched`);
          return data;
        } catch (err) {
          console.warn('[FMP] SubIndicators fetch failed:', err);
          return [];
        }
      })(),
    ]);

    if (indicesResult.status === 'fulfilled' && indicesResult.value.length > 0) {
      // sparklineキャッシュに現在値をappend
      if (sparklineMap) {
        for (const item of indicesResult.value) {
          const existing = sparklineMap[item.id];
          if (existing && existing.length > 0) {
            const lastPoint = existing[existing.length - 1];
            const today = new Date().toISOString().split('T')[0];
            if (lastPoint.time !== today) {
              existing.push({ time: today, value: item.currentValue });
            } else {
              lastPoint.value = item.currentValue;
            }
            item.sparklineData = existing;
          }
        }
      }
      const liveIds = new Set(indicesResult.value.map((i) => i.id));
      indices = [...indicesResult.value, ...mockIndices.filter((m) => !liveIds.has(m.id)).map((m) => ({ ...m, dataSource: 'mock' as const }))];
    }

    if (commoditiesResult.status === 'fulfilled' && commoditiesResult.value.length > 0) {
      if (sparklineMap) {
        for (const item of commoditiesResult.value) {
          const existing = sparklineMap[item.id];
          if (existing && existing.length > 0) {
            const lastPoint = existing[existing.length - 1];
            const today = new Date().toISOString().split('T')[0];
            if (lastPoint.time !== today) {
              existing.push({ time: today, value: item.currentValue });
            } else {
              lastPoint.value = item.currentValue;
            }
            item.sparklineData = existing;
          }
        }
      }
      const liveIds = new Set(commoditiesResult.value.map((i) => i.id));
      commodities = [...commoditiesResult.value, ...mockCommodities.filter((m) => !liveIds.has(m.id)).map((m) => ({ ...m, dataSource: 'mock' as const }))];
    }

    // サブ指標のマージ
    if (subResult.status === 'fulfilled' && subResult.value.length > 0) {
      const liveSubIndicators = subResult.value;

      // 算出指標を生成
      const derivedIndicators = computeDerivedIndicators(indices, forex, liveSubIndicators);

      // ライブ指標のIDセット
      const liveIds = new Set([
        ...liveSubIndicators.map((i) => i.id),
        ...derivedIndicators.map((i) => i.id),
      ]);

      // モック指標にdataSource: 'mock'を付与してマージ
      const mockWithSource = mockSubIndicators
        .filter((m) => !liveIds.has(m.id))
        .map((m) => ({ ...m, dataSource: 'mock' as const }));

      subIndicators = [...liveSubIndicators, ...derivedIndicators, ...mockWithSource];

      // Fear & Greed: VIXから算出
      const vixIndicator = liveSubIndicators.find((i) => i.id === 'vix');
      if (vixIndicator) {
        const fg = vixToFearGreed(vixIndicator.value);
        fearGreed = { ...fg, vix: vixIndicator.value };
      }
    }

    // FMPステータス算出: ライブデータが1件でもあれば 'partial'
    const liveCount =
      (indicesResult.status === 'fulfilled' ? indicesResult.value.length : 0) +
      (commoditiesResult.status === 'fulfilled' ? commoditiesResult.value.length : 0) +
      (subResult.status === 'fulfilled' ? subResult.value.length : 0);
    fmpStatus = liveCount > 0 ? 'partial' : 'failed';
    console.info(`[FMP] fmpStatus=${fmpStatus} (liveCount=${liveCount})`);
  }

  return {
    indices,
    forex,
    commodities,
    crypto,
    subIndicators,
    fearGreed,
    marketSummary: mockMarketSummary,
    lastUpdated: new Date().toISOString(),
    fmpStatus,
  };

  } catch (err) {
    console.error('[MarketData] Critical error in fetchAllMarketData:', err);
    return {
      indices: mockIndices,
      forex: mockForex,
      commodities: mockCommodities,
      crypto: mockCrypto,
      subIndicators: mockSubIndicators,
      fearGreed: mockFearGreed,
      marketSummary: mockMarketSummary,
      lastUpdated: new Date().toISOString(),
      fmpStatus: 'failed',
    };
  }
}
