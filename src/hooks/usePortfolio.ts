import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface HoldingItem {
  code: string;
  name: string;
  marketValue: number;
  profit: number;
  profitRate: number;
  type: string;
  sector?: string;
  portfolioWeight?: number;
}

interface PortfolioData {
  holdings: Record<string, HoldingItem[]>;
  summaryTotals: Record<string, number>;
  updatedAt: string;
}

const DEFAULT_DATA: PortfolioData = {
  holdings: { spot1: [], spot2: [], margin: [] },
  summaryTotals: { spot1: 0, spot2: 0, margin: 0 },
  updatedAt: '',
};

export function usePortfolio() {
  const [portfolio, setPortfolio] = useLocalStorage<PortfolioData>('stock-app-portfolio', DEFAULT_DATA);

  const setHoldings = useCallback((key: string, items: HoldingItem[]) => {
    setPortfolio(prev => ({
      ...prev,
      holdings: { ...prev.holdings, [key]: items },
      updatedAt: new Date().toISOString(),
    }));
  }, [setPortfolio]);

  const setSummaryTotal = useCallback((key: string, value: number) => {
    setPortfolio(prev => ({
      ...prev,
      summaryTotals: { ...prev.summaryTotals, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }, [setPortfolio]);

  return {
    holdings: portfolio.holdings,
    summaryTotals: portfolio.summaryTotals,
    updatedAt: portfolio.updatedAt,
    setHoldings,
    setSummaryTotal,
  };
}
