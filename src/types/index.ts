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
  dataSource?: 'live' | 'mock';
  tvSymbol?: string;
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
  images?: string[];
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
  region?: 'JP' | 'US' | 'other';
  images?: string[];
}

// Settings
export interface Settings {
  fmpApiKey: string;
  autoRefreshInterval: number;
  dataSource: 'auto' | 'mock';
  geminiApiKey: string;
  firebaseProjectId: string;
  firebaseApiKey: string;
  firebaseAppId: string;
}

// Journal
export interface JournalEntry {
  id: string;
  date: string;
  marketOutlook: string;
  conditionRating: number;    // 体調+メンタル
  disciplineRating: number;   // 規律性
  volatilityRating: number;   // ボラティリティ
  fearRating: number;         // 恐怖心
  asExpectedRating: number;   // 想定通りだったか
  notes: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  healthRating?: number;
  mentalRating?: number;
}

export interface TradeRecord {
  id: string;
  date: string;
  ticker: string;
  tickerName: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  reason: string;
  emotion: string;
  pnl?: number;
  tags: string[];
  images?: string[];
  createdAt: string;
}

// Strategy
export type StrategyNoteRegion = 'jp' | 'us' | 'other';
export type StrategyNoteDirection = 'bullish' | 'bearish' | 'neutral';

export interface StrategyNote {
  id: string;
  region: StrategyNoteRegion;
  direction: StrategyNoteDirection;
  title: string;
  description: string;
  url?: string;
  date?: string;
  sourceType?: 'memo' | 'schedule';
  sourceId?: string;
  x: number;
  y: number;
}

export interface StrategyConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export interface StrategyScenario {
  id: string;
  name: string;
  type: string;
  notes: StrategyNote[];
  connections: StrategyConnection[];
  summary: string;
}

export interface ScenarioDescription {
  text: string;
  imageDataUrl?: string;
  urls: string[];
  fontSize?: 'xs' | 'sm' | 'base';
  fontColor?: string;
}

export interface PositionSizing {
  capital: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
}

export interface StrategyData {
  scenarios: StrategyScenario[];
  positionSizing: PositionSizing;
  scenarioDescription: ScenarioDescription;
}

// Watchlist
export interface WatchlistItem {
  id: string;
  ticker: string;
  tickerName: string;
  market: 'JP' | 'US' | 'other';
  currentPrice?: number;
  previousClose?: number;
  notes: string;
  events: ScheduleEvent[];
  tags: string[];
  addedAt: string;
}
