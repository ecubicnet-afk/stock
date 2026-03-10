import type { MarketItem, DataPoint, SubIndicator } from '../../types';

// --- FMP Stable API ---
// FMPは /api/v3/ を廃止し /stable/ に移行済み。
// シンボルはパスではなくクエリパラメータ (?symbol=) で渡す。

const FMP_BASE = 'https://financialmodelingprep.com/stable';

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

// サブ指標用シンボル
const SUB_INDICATOR_SYMBOLS: Record<string, { id: string; nameJa: string; category: SubIndicator['category']; unit: string }> = {
  '^VIX': { id: 'vix', nameJa: 'VIX (恐怖指数)', category: 'volatility', unit: 'pt' },
  '^TNX': { id: 'us10y', nameJa: '米国10年国債利回り', category: 'bonds', unit: '%' },
};

// --- Core fetch ---

async function fetchFmpQuotes(symbols: string[], apiKey: string): Promise<FmpQuote[]> {
  // /stable/quote?symbol=SYM1,SYM2&apikey=KEY
  const symbolList = symbols.join(',');
  const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(symbolList)}&apikey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[FMP] Quote API error ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`FMP API error: ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('[FMP] Unexpected response format:', JSON.stringify(data).slice(0, 200));
      return [];
    }
    return data;
  } catch (err) {
    console.warn('[FMP] fetchFmpQuotes failed:', err);
    throw err;
  }
}

async function fetchFmpHistoricalSingle(symbol: string, apiKey: string): Promise<DataPoint[]> {
  // /stable/historical-price-eod/full?symbol=SYM&from=DATE&to=DATE&apikey=KEY
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const url = `${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&apikey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[FMP] Historical API error ${res.status} for ${symbol}`);
      return [];
    }
    const data = await res.json();

    // stable APIのレスポンス形式に対応（配列 or {historical:[...]}）
    let historical: FmpHistoricalDay[];
    if (Array.isArray(data)) {
      historical = data;
    } else if (data && Array.isArray(data.historical)) {
      historical = data.historical;
    } else {
      console.warn(`[FMP] Unexpected historical response for ${symbol}`);
      return [];
    }

    if (historical.length === 0) return [];

    // 日付昇順にソート
    historical.sort((a, b) => a.date.localeCompare(b.date));

    return historical.slice(-20).map((d) => ({ time: d.date, value: d.close }));
  } catch (err) {
    console.warn(`[FMP] Historical fetch failed for ${symbol}:`, err);
    return [];
  }
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
  const expectedSymbols = Object.keys(symbolMap);
  const receivedSymbols = quotes.map((q) => q.symbol);
  console.info(`[FMP] mapQuotes: expected=${expectedSymbols.join(',')} received=${receivedSymbols.join(',')}`);

  const items: MarketItem[] = [];
  for (const quote of quotes) {
    // シンボル正規化: FMPが %5E 形式で返す場合に対応
    const normalizedSymbol = decodeURIComponent(quote.symbol);
    const meta = symbolMap[quote.symbol] ?? symbolMap[normalizedSymbol];
    if (!meta) {
      console.warn(`[FMP] Unknown symbol in response: "${quote.symbol}" (normalized: "${normalizedSymbol}")`);
      continue;
    }
    if (!quote.price) continue;
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

// --- Public API ---

// バッチ取得 → 失敗時は個別フォールバック
async function fetchQuotesWithFallback(symbols: string[], apiKey: string): Promise<FmpQuote[]> {
  try {
    const quotes = await fetchFmpQuotes(symbols, apiKey);
    if (quotes.length > 0) return quotes;
    console.warn('[FMP] Batch returned 0 quotes, trying individual symbols...');
  } catch (err) {
    console.warn('[FMP] Batch fetch failed, trying individual symbols...', err);
  }
  // 個別フォールバック
  const allQuotes: FmpQuote[] = [];
  for (const symbol of symbols) {
    try {
      const quotes = await fetchFmpQuotes([symbol], apiKey);
      allQuotes.push(...quotes);
    } catch {
      console.warn(`[FMP] Individual fetch failed for ${symbol}`);
    }
  }
  return allQuotes;
}

export async function fetchFmpIndices(apiKey: string, sparklineMap?: Record<string, DataPoint[]>): Promise<MarketItem[]> {
  const symbols = Object.keys(INDEX_SYMBOLS);
  const quotes = await fetchQuotesWithFallback(symbols, apiKey);
  console.info(`[FMP] fetchFmpIndices: ${quotes.length} quotes for ${symbols.length} symbols`);
  return mapQuotesToMarketItems(quotes, INDEX_SYMBOLS, sparklineMap);
}

export async function fetchFmpCommodities(apiKey: string, sparklineMap?: Record<string, DataPoint[]>): Promise<MarketItem[]> {
  const symbols = Object.keys(COMMODITY_SYMBOLS);
  const quotes = await fetchQuotesWithFallback(symbols, apiKey);
  console.info(`[FMP] fetchFmpCommodities: ${quotes.length} quotes for ${symbols.length} symbols`);
  return mapQuotesToMarketItems(quotes, COMMODITY_SYMBOLS, sparklineMap);
}

// サブ指標(VIX, 米10年国債)を取得
export async function fetchFmpSubIndicators(apiKey: string): Promise<SubIndicator[]> {
  const symbols = Object.keys(SUB_INDICATOR_SYMBOLS);
  const quotes = await fetchQuotesWithFallback(symbols, apiKey);
  console.info(`[FMP] fetchFmpSubIndicators: ${quotes.length} quotes for ${symbols.length} symbols`);
  const indicators: SubIndicator[] = [];
  for (const quote of quotes) {
    const normalizedSymbol = decodeURIComponent(quote.symbol);
    const meta = SUB_INDICATOR_SYMBOLS[quote.symbol] ?? SUB_INDICATOR_SYMBOLS[normalizedSymbol];
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

// --- 接続テスト ---

export interface FmpTestResult {
  success: boolean;
  workingSymbols: { symbol: string; name: string; price: number }[];
  failedSymbols: string[];
  message: string;
}

export async function testFmpConnection(apiKey: string): Promise<FmpTestResult> {
  if (!apiKey || apiKey.length < 10) {
    return { success: false, workingSymbols: [], failedSymbols: [], message: 'APIキーが無効です' };
  }

  const working: FmpTestResult['workingSymbols'] = [];
  const failed: string[] = [];

  // 全シンボルリスト
  const allEntries: { symbol: string; label: string }[] = [
    ...Object.entries(INDEX_SYMBOLS).map(([s, m]) => ({ symbol: s, label: `${m.nameJa} (${s})` })),
    ...Object.entries(COMMODITY_SYMBOLS).map(([s, m]) => ({ symbol: s, label: `${m.nameJa} (${s})` })),
    ...Object.entries(SUB_INDICATOR_SYMBOLS).map(([s, m]) => ({ symbol: s, label: `${m.nameJa} (${s})` })),
  ];

  const allSymbols = allEntries.map((e) => e.symbol);

  try {
    // バッチ取得
    const quotes = await fetchFmpQuotes(allSymbols, apiKey);
    const quoteMap = new Map(quotes.filter((q) => q.price > 0).map((q) => [q.symbol, q]));

    for (const entry of allEntries) {
      const quote = quoteMap.get(entry.symbol);
      if (quote) {
        working.push({ symbol: entry.symbol, name: entry.label, price: quote.price });
      } else {
        failed.push(entry.symbol);
      }
    }
  } catch {
    // バッチ失敗 → 個別テスト
    for (const entry of allEntries) {
      try {
        const quotes = await fetchFmpQuotes([entry.symbol], apiKey);
        if (quotes.length > 0 && quotes[0].price > 0) {
          working.push({ symbol: entry.symbol, name: entry.label, price: quotes[0].price });
        } else {
          failed.push(entry.symbol);
        }
      } catch {
        failed.push(entry.symbol);
      }
    }
  }

  const success = working.length > 0;
  const message = success
    ? `接続成功: ${working.length}/${allEntries.length}シンボル取得可能`
    : 'APIキーが無効、またはすべてのシンボルが取得不可です';

  return { success, workingSymbols: working, failedSymbols: failed, message };
}
