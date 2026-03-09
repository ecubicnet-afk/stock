import type { MarketItem } from '../types';
import { fetchCryptoData, fetchForexData } from './api';
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

export async function fetchAllMarketData(dataSource: 'auto' | 'mock'): Promise<FetchResult> {
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

  return {
    indices: mockIndices,
    forex,
    commodities: mockCommodities,
    crypto,
    subIndicators: mockSubIndicators,
    fearGreed: mockFearGreed,
    marketSummary: mockMarketSummary,
    lastUpdated: new Date().toISOString(),
  };
}
