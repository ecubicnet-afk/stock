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

// ダッシュボード用の主要シンボル
// FMP free tierで動作確認済みシンボルを使用
const INDEX_SYMBOLS: Record<string, SymbolMeta> = {
  '%5EN225': { id: 'nikkei225', name: 'Nikkei 225', nameJa: '日経平均株価', category: 'japan', currency: 'JPY', tvSymbol: 'TVC:NI225' },
  '%5ETOPX': { id: 'topix', name: 'TOPIX', nameJa: 'TOPIX', category: 'japan', currency: 'JPY', tvSymbol: 'TSE:TOPIX' },
  '%5EDJI': { id: 'djia', name: 'Dow Jones', nameJa: 'NYダウ', category: 'us', currency: 'USD', tvSymbol: 'TVC:DJI' },
  '%5EGSPC': { id: 'sp500', name: 'S&P 500', nameJa: 'S&P 500', category: 'us', currency: 'USD', tvSymbol: 'SP:SPX' },
  '%5ENDX': { id: 'nasdaq100', name: 'NASDAQ 100', nameJa: 'NASDAQ 100', category: 'us', currency: 'USD', tvSymbol: 'NASDAQ:NDX' },
};

const COMMODITY_SYMBOLS: Record<string, SymbolMeta> = {
  'CLUSD': { id: 'wti', name: 'WTI Crude', nameJa: 'WTI原油', category: 'commodity', currency: 'USD' },
  'GCUSD': { id: 'gold', name: 'Gold', nameJa: '金', category: 'commodity', currency: 'USD' },
};

// コモディティの代替シンボル（free tierで取得不可な場合のフォールバック）
const COMMODITY_ALT_SYMBOLS: Record<string, SymbolMeta> = {
  'USO': { id: 'wti', name: 'WTI Crude', nameJa: 'WTI原油', category: 'commodity', currency: 'USD' },
  'GLD': { id: 'gold', name: 'Gold', nameJa: '金', category: 'commodity', currency: 'USD' },
};

// サブ指標用シンボル
const SUB_INDICATOR_SYMBOLS: Record<string, { id: string; nameJa: string; category: SubIndicator['category']; unit: string }> = {
  '%5EVIX': { id: 'vix', nameJa: 'VIX (恐怖指数)', category: 'volatility', unit: 'pt' },
  '%5ETNX': { id: 'us10y', nameJa: '米国10年国債利回り', category: 'bonds', unit: '%' },
};

// FMPエンコード済みシンボルを元のシンボルに戻す（APIレスポンスのマッチング用）
function decodeSymbol(encoded: string): string {
  return encoded.replace(/%5E/g, '^');
}

async function fetchFmpQuotes(symbols: string[], apiKey: string): Promise<FmpQuote[]> {
  const symbolList = symbols.join(',');
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbolList}?apikey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[FMP] Quote API error ${res.status}: ${text}`);
      throw new Error(`FMP API error: ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('[FMP] Unexpected response format:', data);
      return [];
    }
    return data;
  } catch (err) {
    console.warn('[FMP] fetchFmpQuotes failed:', err);
    throw err;
  }
}

// 個別シンボルの日足ヒストリカルデータを取得
async function fetchFmpHistoricalSingle(symbol: string, apiKey: string): Promise<DataPoint[]> {
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=20&apikey=${apiKey}`
    );
    if (!res.ok) {
      console.warn(`[FMP] Historical API error ${res.status} for ${symbol}`);
      return [];
    }
    const data: FmpHistoricalResponse = await res.json();
    if (!data.historical || data.historical.length === 0) return [];
    // FMPは新しい日付順で返すので逆順にする
    return data.historical
      .slice()
      .reverse()
      .map((d) => ({ time: d.date, value: d.close }));
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
  // エンコード済みシンボル→元シンボルの逆マッピングも作成
  const decodedMap: Record<string, SymbolMeta> = {};
  for (const [key, meta] of Object.entries(symbolMap)) {
    decodedMap[key] = meta;
    decodedMap[decodeSymbol(key)] = meta;
  }

  const items: MarketItem[] = [];
  for (const quote of quotes) {
    const meta = decodedMap[quote.symbol];
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
  // まず通常のコモディティシンボルを試す
  const symbols = Object.keys(COMMODITY_SYMBOLS);
  try {
    const quotes = await fetchFmpQuotes(symbols, apiKey);
    const items = mapQuotesToMarketItems(quotes, COMMODITY_SYMBOLS, sparklineMap);
    if (items.length > 0) return items;
  } catch {
    console.warn('[FMP] Primary commodity symbols failed, trying alternatives...');
  }

  // フォールバック: ETFシンボルで代替取得
  try {
    const altSymbols = Object.keys(COMMODITY_ALT_SYMBOLS);
    const altQuotes = await fetchFmpQuotes(altSymbols, apiKey);
    return mapQuotesToMarketItems(altQuotes, COMMODITY_ALT_SYMBOLS, sparklineMap);
  } catch {
    console.warn('[FMP] Alternative commodity symbols also failed');
    return [];
  }
}

// サブ指標(VIX, 米10年国債)を取得
export async function fetchFmpSubIndicators(apiKey: string): Promise<SubIndicator[]> {
  const symbols = Object.keys(SUB_INDICATOR_SYMBOLS);
  const quotes = await fetchFmpQuotes(symbols, apiKey);

  // エンコード済み/デコード済み両方でマッチ
  const decodedSubMap: Record<string, typeof SUB_INDICATOR_SYMBOLS[string]> = {};
  for (const [key, meta] of Object.entries(SUB_INDICATOR_SYMBOLS)) {
    decodedSubMap[key] = meta;
    decodedSubMap[decodeSymbol(key)] = meta;
  }

  const indicators: SubIndicator[] = [];
  for (const quote of quotes) {
    const meta = decodedSubMap[quote.symbol];
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

// API接続テスト — 各シンボルの取得可否を個別にチェック
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

  const allSymbols = [
    ...Object.keys(INDEX_SYMBOLS),
    ...Object.keys(COMMODITY_SYMBOLS),
    ...Object.keys(SUB_INDICATOR_SYMBOLS),
  ];

  const working: FmpTestResult['workingSymbols'] = [];
  const failed: string[] = [];

  // 全シンボルをバッチで一度に取得
  try {
    const quotes = await fetchFmpQuotes(allSymbols, apiKey);
    const returnedSymbols = new Set(quotes.filter(q => q.price > 0).map(q => q.symbol));

    for (const symbol of allSymbols) {
      const decoded = decodeSymbol(symbol);
      if (returnedSymbols.has(symbol) || returnedSymbols.has(decoded)) {
        const quote = quotes.find(q => q.symbol === symbol || q.symbol === decoded);
        if (quote) {
          working.push({ symbol: decoded, name: decoded, price: quote.price });
        }
      } else {
        failed.push(decoded);
      }
    }
  } catch {
    // バッチ失敗時は個別にテスト
    for (const symbol of allSymbols) {
      try {
        const quotes = await fetchFmpQuotes([symbol], apiKey);
        const decoded = decodeSymbol(symbol);
        if (quotes.length > 0 && quotes[0].price > 0) {
          working.push({ symbol: decoded, name: decoded, price: quotes[0].price });
        } else {
          failed.push(decoded);
        }
      } catch {
        failed.push(decodeSymbol(symbol));
      }
    }
  }

  // コモディティ代替シンボルもテスト
  if (failed.some(s => s === 'CLUSD' || s === 'GCUSD')) {
    for (const [symbol, meta] of Object.entries(COMMODITY_ALT_SYMBOLS)) {
      try {
        const quotes = await fetchFmpQuotes([symbol], apiKey);
        if (quotes.length > 0 && quotes[0].price > 0) {
          working.push({ symbol: `${symbol} (代替: ${meta.nameJa})`, name: meta.nameJa, price: quotes[0].price });
        }
      } catch {
        // skip
      }
    }
  }

  const success = working.length > 0;
  const message = success
    ? `接続成功: ${working.length}/${allSymbols.length}シンボル取得可能`
    : 'APIキーが無効、またはすべてのシンボルが取得不可です';

  return { success, workingSymbols: working, failedSymbols: failed, message };
}
