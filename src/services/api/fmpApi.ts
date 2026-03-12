import type { MarketItem, DataPoint, SubIndicator } from '../../types';

// --- FMP API via Next.js Route Handlers ---
// All API calls go through /api/fmp/* server-side proxy.
// API keys are never sent to the browser.

interface FmpQuote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changesPercentage: number;
}

interface FmpHistoricalDay {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

interface SymbolMeta {
  id: string;
  name: string;
  nameJa: string;
  category: MarketItem['category'];
  currency: string;
  tvSymbol?: string;
}

// ダッシュボード用の主要シンボル
const INDEX_SYMBOLS: Record<string, SymbolMeta> = {
  '^N225': { id: 'nikkei225', name: 'Nikkei 225', nameJa: '日経平均株価', category: 'japan', currency: 'JPY', tvSymbol: 'TVC:NI225' },
  '^TOPX': { id: 'topix', name: 'TOPIX', nameJa: 'TOPIX', category: 'japan', currency: 'JPY', tvSymbol: 'TSE:TOPIX' },
  '^DJI': { id: 'djia', name: 'Dow Jones', nameJa: 'NYダウ', category: 'us', currency: 'USD', tvSymbol: 'TVC:DJI' },
  '^GSPC': { id: 'sp500', name: 'S&P 500', nameJa: 'S&P 500', category: 'us', currency: 'USD', tvSymbol: 'SP:SPX' },
  '^NDX': { id: 'nasdaq100', name: 'NASDAQ 100', nameJa: 'NASDAQ 100', category: 'us', currency: 'USD', tvSymbol: 'NASDAQ:NDX' },
};

const COMMODITY_SYMBOLS: Record<string, SymbolMeta> = {
  'CLUSD': { id: 'wti', name: 'WTI Crude', nameJa: 'WTI原油', category: 'commodity', currency: 'USD' },
  'GCUSD': { id: 'gold', name: 'Gold', nameJa: '金', category: 'commodity', currency: 'USD' },
};

const SUB_INDICATOR_SYMBOLS: Record<string, { id: string; nameJa: string; category: SubIndicator['category']; unit: string }> = {
  '^VIX': { id: 'vix', nameJa: 'VIX (恐怖指数)', category: 'volatility', unit: 'pt' },
  '^TNX': { id: 'us10y', nameJa: '米国10年国債利回り', category: 'bonds', unit: '%' },
};

// --- Core fetch (via server proxy) ---

async function fetchFmpQuotes(symbols: string[]): Promise<FmpQuote[]> {
  const symbolList = symbols.join(',');
  const url = `/api/fmp/quotes?symbols=${encodeURIComponent(symbolList)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FMP API error: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch (err) {
    console.warn('[FMP] fetchFmpQuotes failed:', err);
    throw err;
  }
}

async function fetchFmpHistoricalSingle(symbol: string): Promise<DataPoint[]> {
  const url = `/api/fmp/historical?symbol=${encodeURIComponent(symbol)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    let historical: FmpHistoricalDay[];
    if (Array.isArray(data)) {
      historical = data;
    } else if (data && Array.isArray(data.historical)) {
      historical = data.historical;
    } else {
      return [];
    }

    if (historical.length === 0) return [];
    historical.sort((a, b) => a.date.localeCompare(b.date));
    return historical.slice(-20).map((d) => ({ time: d.date, value: d.close }));
  } catch {
    return [];
  }
}

export async function fetchFmpSparklines(): Promise<Record<string, DataPoint[]>> {
  const allSymbols = { ...INDEX_SYMBOLS, ...COMMODITY_SYMBOLS };
  const entries = Object.entries(allSymbols);
  const results = await Promise.allSettled(
    entries.map(async ([symbol, meta]) => {
      const data = await fetchFmpHistoricalSingle(symbol);
      return { id: meta.id, data };
    })
  );
  const sparklineMap: Record<string, DataPoint[]> = {};
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data.length > 0) {
      sparklineMap[result.value.id] = result.value.data;
    }
  }
  return sparklineMap;
}

// --- Mapping ---

function mapQuotesToMarketItems(
  quotes: FmpQuote[],
  symbolMap: Record<string, SymbolMeta>,
  sparklineMap?: Record<string, DataPoint[]>
): MarketItem[] {
  const items: MarketItem[] = [];
  for (const quote of quotes) {
    const normalizedSymbol = decodeURIComponent(quote.symbol);
    const meta = symbolMap[quote.symbol] ?? symbolMap[normalizedSymbol];
    if (!meta) continue;
    if (!quote.price) continue;
    const sparkline = sparklineMap?.[meta.id] ?? [];
    items.push({
      id: meta.id,
      name: meta.name,
      nameJa: meta.nameJa,
      category: meta.category,
      currentValue: quote.price ?? 0,
      previousClose: quote.previousClose || (quote.price ?? 0) - (quote.change ?? 0),
      change: quote.change ?? 0,
      changePercent: quote.changesPercentage ?? 0,
      sparklineData: sparkline,
      currency: meta.currency,
      lastUpdated: new Date().toISOString(),
      dataSource: 'live',
      tvSymbol: meta.tvSymbol,
    });
  }
  return items;
}

// --- Public API (no apiKey parameter needed) ---

async function fetchQuotesWithFallback(symbols: string[]): Promise<FmpQuote[]> {
  try {
    const quotes = await fetchFmpQuotes(symbols);
    if (quotes.length > 0) return quotes;
  } catch {
    // Fall through to individual
  }
  const allQuotes: FmpQuote[] = [];
  for (const symbol of symbols) {
    try {
      const quotes = await fetchFmpQuotes([symbol]);
      allQuotes.push(...quotes);
    } catch {
      // skip
    }
  }
  return allQuotes;
}

export async function fetchFmpIndices(sparklineMap?: Record<string, DataPoint[]>): Promise<MarketItem[]> {
  const symbols = Object.keys(INDEX_SYMBOLS);
  const quotes = await fetchQuotesWithFallback(symbols);
  return mapQuotesToMarketItems(quotes, INDEX_SYMBOLS, sparklineMap);
}

export async function fetchFmpCommodities(sparklineMap?: Record<string, DataPoint[]>): Promise<MarketItem[]> {
  const symbols = Object.keys(COMMODITY_SYMBOLS);
  const quotes = await fetchQuotesWithFallback(symbols);
  return mapQuotesToMarketItems(quotes, COMMODITY_SYMBOLS, sparklineMap);
}

export async function fetchFmpSubIndicators(): Promise<SubIndicator[]> {
  const symbols = Object.keys(SUB_INDICATOR_SYMBOLS);
  const quotes = await fetchQuotesWithFallback(symbols);
  const indicators: SubIndicator[] = [];
  for (const quote of quotes) {
    const normalizedSymbol = decodeURIComponent(quote.symbol);
    const meta = SUB_INDICATOR_SYMBOLS[quote.symbol] ?? SUB_INDICATOR_SYMBOLS[normalizedSymbol];
    if (!meta || !quote.price) continue;
    const change = quote.change ?? 0;
    const changePercent = quote.changesPercentage ?? 0;
    let signal: SubIndicator['signal'] = 'neutral';
    if (meta.id === 'vix') {
      signal = quote.price > 25 ? 'bearish' : quote.price < 15 ? 'bullish' : 'neutral';
    } else if (meta.id === 'us10y') {
      signal = change > 0.1 ? 'bearish' : change < -0.1 ? 'bullish' : 'neutral';
    }
    indicators.push({
      id: meta.id,
      name: quote.symbol,
      nameJa: meta.nameJa,
      category: meta.category,
      value: quote.price,
      change,
      changePercent,
      unit: meta.unit,
      signal,
      dataSource: 'live',
    });
  }
  return indicators;
}

// --- 接続テスト ---

export interface FmpTestResult {
  success: boolean;
  configured: boolean;
  workingSymbols: { symbol: string; price: number }[];
  failedSymbols: string[];
  message: string;
}

export async function testFmpConnection(): Promise<FmpTestResult> {
  try {
    const res = await fetch('/api/fmp/test');
    return await res.json();
  } catch {
    return { success: false, configured: false, workingSymbols: [], failedSymbols: [], message: '接続テストに失敗しました' };
  }
}
