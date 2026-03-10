import type { MarketItem } from '../types';
import { fetchCryptoData, fetchForexData, fetchFmpIndices, fetchFmpCommodities } from './api';
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
const FMP_TTL = 900_000; // 15min — Free枠250req/日に収まるよう

export interface FetchResult {
  indices: MarketItem[];
  forex: MarketItem[];
  commodities: MarketItem[];
  crypto: MarketItem[];
  subIndicators: typeof mockSubIndicators;
  fearGreed: typeof mockFearGreed;
  marketSummary: typeof mockMarketSummary;
  lastUpdated: string;
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
    };
  }

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

  // FMP API: indices & commodities (when API key is available)
  let indices = mockIndices;
  let commodities = mockCommodities;

  if (fmpApiKey) {
    const [indicesResult, commoditiesResult] = await Promise.allSettled([
      (async () => {
        const cached = getCached<MarketItem[]>('fmp-indices', FMP_TTL);
        if (cached) return cached;
        const data = await fetchFmpIndices(fmpApiKey);
        setCache('fmp-indices', data);
        return data;
      })(),
      (async () => {
        const cached = getCached<MarketItem[]>('fmp-commodities', FMP_TTL);
        if (cached) return cached;
        const data = await fetchFmpCommodities(fmpApiKey);
        setCache('fmp-commodities', data);
        return data;
      })(),
    ]);

    if (indicesResult.status === 'fulfilled' && indicesResult.value.length > 0) {
      const liveIds = new Set(indicesResult.value.map((i) => i.id));
      indices = [...indicesResult.value, ...mockIndices.filter((m) => !liveIds.has(m.id))];
    }
    if (commoditiesResult.status === 'fulfilled' && commoditiesResult.value.length > 0) {
      const liveIds = new Set(commoditiesResult.value.map((i) => i.id));
      commodities = [...commoditiesResult.value, ...mockCommodities.filter((m) => !liveIds.has(m.id))];
    }
  }

  return {
    indices,
    forex,
    commodities,
    crypto,
    subIndicators: mockSubIndicators,
    fearGreed: mockFearGreed,
    marketSummary: mockMarketSummary,
    lastUpdated: new Date().toISOString(),
  };
}
