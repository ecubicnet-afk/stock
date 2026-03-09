export interface DataPoint {
  time: string;
  value: number;
}

export interface MarketItem {
  id: string;
  name: string;
  nameJa: string;
  category: 'japan' | 'us' | 'europe' | 'asia' | 'forex' | 'commodity' | 'crypto';
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  sparklineData: DataPoint[];
  currency: string;
  lastUpdated: string;
}

export interface SubIndicator {
  id: string;
  name: string;
  nameJa: string;
  category: 'volatility' | 'sentiment' | 'trading' | 'valuation' | 'bonds' | 'other';
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface FearGreedData {
  value: number;
  label: string;
  vix: number;
}

export interface MarketStatus {
  market: string;
  isOpen: boolean;
  nextEvent: string;
}

export interface MarketSummary {
  text: string;
  timestamp: string;
}

export interface NavItem {
  path: string;
  label: string;
  labelJa: string;
  icon: string;
}

// OHLC data for candlestick charts
export interface OHLCDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Memo & Schedule
export interface MemoEntry {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  importance: 'high' | 'medium' | 'low';
  description?: string;
}
