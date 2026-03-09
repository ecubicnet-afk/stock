import type { MarketItem, SubIndicator, FearGreedData, MarketSummary, DataPoint } from '../types';
import type { OHLCDataPoint } from '../types';

function generateSparkline(base: number, volatility: number, points = 20): DataPoint[] {
  const data: DataPoint[] = [];
  let value = base - volatility * 2;
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.48) * volatility;
    data.push({
      time: `${i}`,
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

function makeItem(
  id: string,
  name: string,
  nameJa: string,
  category: MarketItem['category'],
  currentValue: number,
  change: number,
  currency: string,
  volatility: number,
  tvSymbol?: string
): MarketItem {
  const previousClose = currentValue - change;
  const changePercent = (change / previousClose) * 100;
  return {
    id,
    name,
    nameJa,
    category,
    currentValue,
    previousClose,
    change,
    changePercent,
    sparklineData: generateSparkline(currentValue, volatility),
    currency,
    lastUpdated: new Date().toISOString(),
    tvSymbol,
  };
}

export const mockIndices: MarketItem[] = [
  // Japan (3/9 intraday — 中東危機で暴落中)
  makeItem('nikkei225', 'Nikkei 225', '日経平均株価', 'japan', 51905.00, -3716.00, 'JPY', 500, 'TVC:NI225'),
  makeItem('topix', 'TOPIX', 'TOPIX', 'japan', 3500.00, -217.00, 'JPY', 30, 'TSE:TOPIX'),
  makeItem('growth250', 'Growth 250', 'グロース250', 'japan', 749.03, -28.50, 'JPY', 8, 'TSE:MOTHERS'),
  makeItem('jpx400', 'JPX Nikkei 400', 'JPX日経400', 'japan', 32951.41, -1850.00, 'JPY', 250, 'TVC:NI225'),
  makeItem('tse-reit', 'TSE REIT', '東証REIT指数', 'japan', 1994.36, -32.80, 'JPY', 12, 'TSE:1398'),
  makeItem('nikkei-futures', 'Nikkei 225 Futures', '日経225先物', 'japan', 51680.00, -3890.00, 'JPY', 600, 'CME:NKD1!'),

  // US (3/6 close)
  makeItem('djia', 'Dow Jones', 'NYダウ', 'us', 47501.55, -453.19, 'USD', 200, 'TVC:DJI'),
  makeItem('sp500', 'S&P 500', 'S&P 500', 'us', 6740.02, -90.69, 'USD', 35, 'SP:SPX'),
  makeItem('nasdaq', 'NASDAQ', 'NASDAQ総合', 'us', 22387.68, -361.31, 'USD', 120, 'NASDAQ:IXIC'),
  makeItem('nasdaq100', 'NASDAQ 100', 'NASDAQ 100', 'us', 24643.02, -376.85, 'USD', 130, 'NASDAQ:NDX'),
  makeItem('russell2000', 'Russell 2000', 'Russell 2000', 'us', 2525.30, -60.30, 'USD', 20, 'TVC:RUT'),

  // Europe (3/6)
  makeItem('ftse100', 'FTSE 100', 'FTSE 100', 'europe', 10511.21, -56.15, 'GBP', 50, 'TVC:UKX'),
  makeItem('dax', 'DAX', 'DAX', 'europe', 23591.03, -225.40, 'EUR', 100, 'XETR:DAX'),
  makeItem('cac40', 'CAC 40', 'CAC 40', 'europe', 7993.49, -52.30, 'EUR', 40, 'TVC:CAC40'),

  // Asia
  makeItem('shanghai', 'Shanghai Comp.', '上海総合指数', 'asia', 4118.68, -35.20, 'CNY', 25, 'SSE:000001'),
  makeItem('hangseng', 'Hang Seng', 'ハンセン指数', 'asia', 25051.06, -715.80, 'HKD', 150, 'TVC:HSI'),
  makeItem('kospi', 'KOSPI', 'KOSPI', 'asia', 5519.64, -445.00, 'KRW', 50, 'KRX:KOSPI'),
  makeItem('taiex', 'TAIEX', '台湾加権指数', 'asia', 33599.54, -73.40, 'TWD', 150, 'TWSE:TAIEX'),
];

export const mockForex: MarketItem[] = [
  makeItem('usdjpy', 'USD/JPY', 'ドル円', 'forex', 158.72, 1.73, 'JPY', 0.8),
  makeItem('eurjpy', 'EUR/JPY', 'ユーロ円', 'forex', 184.49, 0.36, 'JPY', 0.6),
  makeItem('gbpjpy', 'GBP/JPY', 'ポンド円', 'forex', 211.61, 2.15, 'JPY', 0.9),
  makeItem('eurusd', 'EUR/USD', 'ユーロドル', 'forex', 1.1522, -0.0012, 'USD', 0.004),
  makeItem('audjpy', 'AUD/JPY', '豪ドル円', 'forex', 110.50, 0.85, 'JPY', 0.5),
];

export const mockCommodities: MarketItem[] = [
  makeItem('wti', 'WTI Crude', 'WTI原油', 'commodity', 115.32, 8.45, 'USD', 4),
  makeItem('gold', 'Gold', '金', 'commodity', 5090.00, 42.80, 'USD', 25),
  makeItem('silver', 'Silver', '銀', 'commodity', 85.29, 2.85, 'USD', 1),
  makeItem('copper', 'Copper', '銅', 'commodity', 6.660, 0.125, 'USD', 0.05),
  makeItem('natgas', 'Natural Gas', '天然ガス', 'commodity', 3.190, -0.085, 'USD', 0.04),
];

export const mockCrypto: MarketItem[] = [
  makeItem('btc', 'Bitcoin', 'BTC', 'crypto', 67340.00, -2850.00, 'USD', 800),
  makeItem('eth', 'Ethereum', 'ETH', 'crypto', 1982.00, -68.50, 'USD', 30),
  makeItem('xrp', 'XRP', 'XRP', 'crypto', 1.3700, -0.0520, 'USD', 0.03),
  makeItem('sol', 'Solana', 'SOL', 'crypto', 84.50, -5.80, 'USD', 3),
  makeItem('bnb', 'BNB', 'BNB', 'crypto', 615.00, -18.50, 'USD', 6),
];

export const mockSubIndicators: SubIndicator[] = [
  // Volatility
  { id: 'nikkei-vi', name: 'Nikkei VI', nameJa: '日経VI', category: 'volatility', value: 42.00, change: 12.50, changePercent: 42.37, unit: 'pt', signal: 'bearish' },
  { id: 'vix', name: 'VIX', nameJa: 'VIX (恐怖指数)', category: 'volatility', value: 29.49, change: 5.62, changePercent: 23.55, unit: 'pt', signal: 'bearish' },

  // Sentiment
  { id: 'advance-decline', name: 'Advance/Decline Ratio', nameJa: '騰落レシオ (25日)', category: 'sentiment', value: 78.5, change: -18.2, changePercent: -18.82, unit: '%', signal: 'bearish' },
  { id: 'new-highs', name: 'New Highs', nameJa: '新高値銘柄数', category: 'sentiment', value: 8, change: -35, changePercent: -81.40, unit: '', signal: 'bearish' },
  { id: 'new-lows', name: 'New Lows', nameJa: '新安値銘柄数', category: 'sentiment', value: 285, change: 248, changePercent: 670.27, unit: '', signal: 'bearish' },

  // Trading
  { id: 'short-sell-ratio', name: 'Short Sell Ratio', nameJa: '空売り比率', category: 'trading', value: 48.5, change: 5.8, changePercent: 13.58, unit: '%', signal: 'bearish' },
  { id: 'margin-buy', name: 'Margin Buy', nameJa: '信用買い残', category: 'trading', value: 4.25, change: -0.15, changePercent: -3.41, unit: '兆円', signal: 'neutral' },
  { id: 'margin-sell', name: 'Margin Sell', nameJa: '信用売り残', category: 'trading', value: 1.05, change: 0.12, changePercent: 12.90, unit: '兆円', signal: 'bearish' },

  // Valuation
  { id: 'nikkei-per', name: 'Nikkei PER', nameJa: '日経平均PER', category: 'valuation', value: 16.50, change: -1.20, changePercent: -6.78, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-pbr', name: 'Nikkei PBR', nameJa: '日経平均PBR', category: 'valuation', value: 1.52, change: -0.10, changePercent: -6.17, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-eps', name: 'Nikkei EPS', nameJa: '日経平均EPS', category: 'valuation', value: 3145.80, change: 0.00, changePercent: 0.00, unit: '円', signal: 'neutral' },

  // Bonds
  { id: 'jp10y', name: 'Japan 10Y', nameJa: '日本10年国債利回り', category: 'bonds', value: 2.220, change: 0.085, changePercent: 3.98, unit: '%', signal: 'bearish' },
  { id: 'us10y', name: 'US 10Y', nameJa: '米国10年国債利回り', category: 'bonds', value: 4.150, change: 0.200, changePercent: 5.06, unit: '%', signal: 'bearish' },
  { id: 'rate-spread', name: 'US-JP Spread', nameJa: '日米金利差', category: 'bonds', value: 1.930, change: 0.115, changePercent: 6.34, unit: '%', signal: 'neutral' },

  // Other
  { id: 'nt-ratio', name: 'NT Ratio', nameJa: 'NT倍率', category: 'other', value: 14.83, change: -0.05, changePercent: -0.34, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-usd', name: 'Nikkei USD', nameJa: 'ドル建て日経平均', category: 'other', value: 327.00, change: -25.50, changePercent: -7.23, unit: 'USD', signal: 'bearish' },
  { id: 'arb-buy', name: 'Arbitrage Buy', nameJa: '裁定買い残', category: 'other', value: 1.42, change: -0.18, changePercent: -11.25, unit: '兆円', signal: 'bearish' },
];

export const mockFearGreed: FearGreedData = {
  value: 22,
  label: 'Extreme Fear',
  vix: 29.49,
};

export const mockMarketSummary: MarketSummary = {
  text: '日経平均は前日比-3,716円の51,905円と暴落。中東危機でWTI原油は90ドル台に急騰。ドル円は158.72円。VIXは29.49と急上昇。',
  timestamp: new Date().toISOString(),
};

// OHLC data generation for candlestick charts
function generateOHLCData(basePrice: number, volatilityPct: number, days: number): OHLCDataPoint[] {
  const data: OHLCDataPoint[] = [];
  let price = basePrice;
  const endDate = new Date('2026-03-09');
  const dates: Date[] = [];

  // Generate trading days (skip weekends)
  const d = new Date(endDate);
  d.setDate(d.getDate() - days * 1.5);
  while (dates.length < days) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  for (const date of dates) {
    const vol = price * volatilityPct;
    const open = price + (Math.random() - 0.5) * vol * 0.3;
    const close = open + (Math.random() - 0.48) * vol;
    const high = Math.max(open, close) + Math.random() * vol * 0.5;
    const low = Math.min(open, close) - Math.random() * vol * 0.5;
    const volume = Math.round((0.8 + Math.random() * 0.4) * 2500000000);

    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    price = close;
  }

  return data;
}

export interface ChartSymbol {
  id: string;
  name: string;
  nameJa: string;
  tvSymbol: string;
}

export const chartSymbols: ChartSymbol[] = [
  { id: 'nikkei225', name: 'Nikkei 225', nameJa: '日経平均株価', tvSymbol: 'TVC:NI225' },
  { id: 'nikkei-futures', name: 'Nikkei 225 Futures', nameJa: '日経225先物', tvSymbol: 'CME:NKD1!' },
  { id: 'sp500', name: 'S&P 500', nameJa: 'S&P 500', tvSymbol: 'SP:SPX' },
  { id: 'nasdaq', name: 'NASDAQ', nameJa: 'NASDAQ総合', tvSymbol: 'NASDAQ:IXIC' },
];

export const mockOHLCData: Record<string, OHLCDataPoint[]> = {
  nikkei225: generateOHLCData(50000, 0.012, 60),
  sp500: generateOHLCData(6500, 0.010, 60),
  nasdaq: generateOHLCData(22000, 0.015, 60),
};
