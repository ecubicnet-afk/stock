import type { MarketItem, DataPoint, SubIndicator } from '../../types';

interface FmpQuote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changesPercentage: number;
}

interface FmpHistoricalDay {
  date: string;
  close: number;
}

interface FmpHistoricalResponse {
  symbol: string;
  historical: FmpHistoricalDay[];
}

interface SymbolMeta {
  id: string;
  name: string;
  nameJa: string;
  category: MarketItem['category'];
  currency: string;
  tvSymbol?: string;
}

// ダッシュボード用の主要シンボル（8シンボルに絞る）
const INDEX_SYMBOLS: Record<string, SymbolMeta> = {
  '^N225': { id: 'nikkei225', name: 'Nikkei 225', nameJa: '日経平均株価', category: 'japan', currency: 'JPY', tvSymbol: 'TVC:NI225' },
  '^TOPX': { id: 'topix', name: 'TOPIX', nameJa: 'TOPIX', category: 'japan', currency: 'JPY', tvSymbol: 'TSE:TOPIX' },
  '^DJI': { id: 'djia', name: 'Dow Jones', nameJa: 'NYダウ', category: 'us', currency: 'USD', tvSymbol: 'TVC:DJI' },
  '^NDX': { id: 'nasdaq100', name: 'NASDAQ 100', nameJa: 'NASDAQ 100', category: 'us', currency: 'USD', tvSymbol: 'NASDAQ:NDX' },
};

const COMMODITY_SYMBOLS: Record<string, SymbolMeta> = {
  'CLUSD': { id: 'wti', name: 'WTI Crude', nameJa: 'WTI原油', category: 'commodity', currency: 'USD' },
  'GCUSD': { id: 'gold', name: 'Gold', nameJa: '金', category: 'commodity', currency: 'USD' },
};

// サブ指標用シンボル
const SUB_INDICATOR_SYMBOLS: Record<string, { id: string; nameJa: string; category: SubIndicator['category']; unit: string }> = {
  '^VIX': { id: 'vix', nameJa: 'VIX (恐怖指数)', category: 'volatility', unit: 'pt' },
  '^TNX': { id: 'us10y', nameJa: '米国10年国債利回り', category: 'bonds', unit: '%' },
};

async function fetchFmpQuotes(symbols: string[], apiKey: string): Promise<FmpQuote[]> {
  const symbolList = symbols.join(',');
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${symbolList}?apikey=${apiKey}`
  );
  if (!res.ok) throw new Error(`FMP API error: ${res.status}`);
  return res.json();
}

// 個別シンボルの日足ヒストリカルデータを取得
async function fetchFmpHistoricalSingle(symbol: string, apiKey: string): Promise<DataPoint[]> {
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=20&apikey=${apiKey}`
  );
  if (!res.ok) throw new Error(`FMP Historical API error: ${res.status}`);
  const data: FmpHistoricalResponse = await res.json();
  if (!data.historical || data.historical.length === 0) return [];
  // FMPは新しい日付順で返すので逆順にする
  return data.historical
    .slice()
    .reverse()
    .map((d) => ({ time: d.date, value: d.close }));
}

// 全シンボルのスパークラインデータを並列取得
export async function fetchFmpSparklines(apiKey: string): Promise<Record<string, DataPoint[]>> {
  const allSymbols = { ...INDEX_SYMBOLS, ...COMMODITY_SYMBOLS };
  const entries = Object.entries(allSymbols);
  const results = await Promise.allSettled(
    entries.map(async ([symbol, meta]) => {
      const data = await fetchFmpHistoricalSingle(symbol, apiKey);
      return { id: meta.id, data };
    })
  );
  const sparklineMap: Record<string, DataPoint[]> = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      sparklineMap[result.value.id] = result.value.data;
    }
  }
  return sparklineMap;
}

function mapQuotesToMarketItems(
  quotes: FmpQuote[],
  symbolMap: Record<string, SymbolMeta>,
  sparklineMap?: Record<string, DataPoint[]>
): MarketItem[] {
  const items: MarketItem[] = [];
  for (const quote of quotes) {
    const meta = symbolMap[quote.symbol];
    if (!meta || !quote.price) continue;
    const sparkline = sparklineMap?.[meta.id] ?? [];
    items.push({
      id: meta.id,
      name: meta.name,
      nameJa: meta.nameJa,
      category: meta.category,
      currentValue: quote.price,
      previousClose: quote.previousClose || quote.price - quote.change,
      change: quote.change,
      changePercent: quote.changesPercentage,
      sparklineData: sparkline,
      currency: meta.currency,
      lastUpdated: new Date().toISOString(),
      dataSource: 'live',
      tvSymbol: meta.tvSymbol,
    });
  }
  return items;
}

export async function fetchFmpIndices(apiKey: string, sparklineMap?: Record<string, DataPoint[]>): Promise<MarketItem[]> {
  const symbols = Object.keys(INDEX_SYMBOLS);
  const quotes = await fetchFmpQuotes(symbols, apiKey);
  return mapQuotesToMarketItems(quotes, INDEX_SYMBOLS, sparklineMap);
}

export async function fetchFmpCommodities(apiKey: string, sparklineMap?: Record<string, DataPoint[]>): Promise<MarketItem[]> {
  const symbols = Object.keys(COMMODITY_SYMBOLS);
  const quotes = await fetchFmpQuotes(symbols, apiKey);
  return mapQuotesToMarketItems(quotes, COMMODITY_SYMBOLS, sparklineMap);
}

// サブ指標(VIX, 米10年国債)を取得
export async function fetchFmpSubIndicators(apiKey: string): Promise<SubIndicator[]> {
  const symbols = Object.keys(SUB_INDICATOR_SYMBOLS);
  const quotes = await fetchFmpQuotes(symbols, apiKey);
  const indicators: SubIndicator[] = [];
  for (const quote of quotes) {
    const meta = SUB_INDICATOR_SYMBOLS[quote.symbol];
    if (!meta || !quote.price) continue;
    const change = quote.change;
    const changePercent = quote.changesPercentage;
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
