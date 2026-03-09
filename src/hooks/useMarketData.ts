import { useState, useEffect } from 'react';
import type { MarketItem, SubIndicator, FearGreedData, MarketSummary } from '../types';
import {
  mockIndices,
  mockForex,
  mockCommodities,
  mockCrypto,
  mockSubIndicators,
  mockFearGreed,
  mockMarketSummary,
} from '../services/mockData';

interface MarketData {
  indices: MarketItem[];
  forex: MarketItem[];
  commodities: MarketItem[];
  crypto: MarketItem[];
  subIndicators: SubIndicator[];
  fearGreed: FearGreedData;
  marketSummary: MarketSummary;
  isLoading: boolean;
}

export function useMarketData(): MarketData {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Omit<MarketData, 'isLoading'>>({
    indices: [],
    forex: [],
    commodities: [],
    crypto: [],
    subIndicators: [],
    fearGreed: { value: 0, label: '', vix: 0 },
    marketSummary: { text: '', timestamp: '' },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        indices: mockIndices,
        forex: mockForex,
        commodities: mockCommodities,
        crypto: mockCrypto,
        subIndicators: mockSubIndicators,
        fearGreed: mockFearGreed,
        marketSummary: mockMarketSummary,
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { ...data, isLoading };
}
