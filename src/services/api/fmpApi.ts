import type { MarketItem } from '../../types';

interface FmpQuote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changesPercentage: number;
}

interface SymbolMeta {
  id: string;
  name: string;
  nameJa: string;
  category: MarketItem['category'];
  currency: string;
  tvSymbol?: string;
}

const INDEX_SYMBOLS: Record<string, SymbolMeta> = {
  '^N225': { id: 'nikkei225', name: 'Nikkei 225', nameJa: '日経平均株価', category: 'japan', currency: 'JPY', tvSymbol: 'TVC:NI225' },
  '^TOPX': { id: 'topix', name: 'TOPIX', nameJa: 'TOPIX', category: 'japan', currency: 'JPY', tvSymbol: 'TSE:TOPIX' },
  '^DJI': { id: 'djia', name: 'Dow Jones', nameJa: 'NYダウ', category: 'us', currency: 'USD', tvSymbol: 'TVC:DJI' },
  '^GSPC': { id: 'sp500', name: 'S&P 500', nameJa: 'S&P 500', category: 'us', currency: 'USD', tvSymbol: 'SP:SPX' },
  '^IXIC': { id: 'nasdaq', name: 'NASDAQ', nameJa: 'NASDAQ総合', category: 'us', currency: 'USD', tvSymbol: 'NASDAQ:IXIC' },
  '^NDX': { id: 'nasdaq100', name: 'NASDAQ 100', nameJa: 'NASDAQ 100', category: 'us', currency: 'USD', tvSymbol: 'NASDAQ:NDX' },
  '^RUT': { id: 'russell2000', name: 'Russell 2000', nameJa: 'Russell 2000', category: 'us', currency: 'USD', tvSymbol: 'TVC:RUT' },
  '^FTSE': { id: 'ftse100', name: 'FTSE 100', nameJa: 'FTSE 100', category: 'europe', currency: 'GBP', tvSymbol: 'TVC:UKX' },
  '^GDAXI': { id: 'dax', name: 'DAX', nameJa: 'DAX', category: 'europe', currency: 'EUR', tvSymbol: 'XETR:DAX' },
  '^FCHI': { id: 'cac40', name: 'CAC 40', nameJa: 'CAC 40', category: 'europe', currency: 'EUR', tvSymbol: 'TVC:CAC40' },
  '^HSI': { id: 'hangseng', name: 'Hang Seng', nameJa: 'ハンセン指数', category: 'asia', currency: 'HKD', tvSymbol: 'TVC:HSI' },
  '^KS11': { id: 'kospi', name: 'KOSPI', nameJa: 'KOSPI', category: 'asia', currency: 'KRW', tvSymbol: 'KRX:KOSPI' },
};

const COMMODITY_SYMBOLS: Record<string, SymbolMeta> = {
  'CLUSD': { id: 'wti', name: 'WTI Crude', nameJa: 'WTI原油', category: 'commodity', currency: 'USD' },
  'GCUSD': { id: 'gold', name: 'Gold', nameJa: '金', category: 'commodity', currency: 'USD' },
  'SIUSD': { id: 'silver', name: 'Silver', nameJa: '銀', category: 'commodity', currency: 'USD' },
  'HGUSD': { id: 'copper', name: 'Copper', nameJa: '銅', category: 'commodity', currency: 'USD' },
  'NGUSD': { id: 'natgas', name: 'Natural Gas', nameJa: '天然ガス', category: 'commodity', currency: 'USD' },
};

async function fetchFmpQuotes(symbols: string[], apiKey: string): Promise<FmpQuote[]> {
  const symbolList = symbols.join(',');
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${symbolList}?apikey=${apiKey}`
  );
  if (!res.ok) throw new Error(`FMP API error: ${res.status}`);
  return res.json();
}

function mapQuotesToMarketItems(quotes: FmpQuote[], symbolMap: Record<string, SymbolMeta>): MarketItem[] {
  const items: MarketItem[] = [];
  for (const quote of quotes) {
    const meta = symbolMap[quote.symbol];
    if (!meta || !quote.price) continue;
    items.push({
      id: meta.id,
      name: meta.name,
      nameJa: meta.nameJa,
      category: meta.category,
      currentValue: quote.price,
      previousClose: quote.previousClose || quote.price - quote.change,
      change: quote.change,
      changePercent: quote.changesPercentage,
      sparklineData: [],
      currency: meta.currency,
      lastUpdated: new Date().toISOString(),
      dataSource: 'live',
      tvSymbol: meta.tvSymbol,
    });
  }
  return items;
}

export async function fetchFmpIndices(apiKey: string): Promise<MarketItem[]> {
  const symbols = Object.keys(INDEX_SYMBOLS);
  const quotes = await fetchFmpQuotes(symbols, apiKey);
  return mapQuotesToMarketItems(quotes, INDEX_SYMBOLS);
}

export async function fetchFmpCommodities(apiKey: string): Promise<MarketItem[]> {
  const symbols = Object.keys(COMMODITY_SYMBOLS);
  const quotes = await fetchFmpQuotes(symbols, apiKey);
  return mapQuotesToMarketItems(quotes, COMMODITY_SYMBOLS);
}
