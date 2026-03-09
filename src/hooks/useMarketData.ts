import { useState, useEffect, useCallback } from 'react';
import type { MarketItem, SubIndicator, FearGreedData, MarketSummary } from '../types';
import { fetchAllMarketData } from '../services/marketDataProvider';
import { useSettings } from './useSettings';

interface MarketData {
  indices: MarketItem[];
  forex: MarketItem[];
  commodities: MarketItem[];
  crypto: MarketItem[];
  subIndicators: SubIndicator[];
  fearGreed: FearGreedData;
  marketSummary: MarketSummary;
  isLoading: boolean;
  lastUpdated: string;
}

export function useMarketData(): MarketData {
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [data, setData] = useState<Omit<MarketData, 'isLoading' | 'lastUpdated'>>({
    indices: [],
    forex: [],
    commodities: [],
    crypto: [],
    subIndicators: [],
    fearGreed: { value: 0, label: '', vix: 0 },
    marketSummary: { text: '', timestamp: '' },
  });

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchAllMarketData(settings.dataSource);
      setData({
        indices: result.indices,
        forex: result.forex,
        commodities: result.commodities,
        crypto: result.crypto,
        subIndicators: result.subIndicators,
        fearGreed: result.fearGreed,
        marketSummary: result.marketSummary,
      });
      setLastUpdated(result.lastUpdated);
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [settings.dataSource]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, settings.autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchData, settings.autoRefreshInterval]);

  return { ...data, isLoading, lastUpdated };
}
