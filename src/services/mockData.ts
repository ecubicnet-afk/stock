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
  volatility: number
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
  };
}

export const mockIndices: MarketItem[] = [
  // Japan
  makeItem('nikkei225', 'Nikkei 225', '日経平均株価', 'japan', 41250.80, 285.32, 'JPY', 180),
  makeItem('topix', 'TOPIX', 'TOPIX', 'japan', 2885.20, 15.80, 'JPY', 12),
  makeItem('growth250', 'Growth 250', 'グロース250', 'japan', 725.30, -5.20, 'JPY', 5),
  makeItem('jpx400', 'JPX Nikkei 400', 'JPX日経400', 'japan', 23180.50, 98.40, 'JPY', 90),
  makeItem('tse-reit', 'TSE REIT', '東証REIT指数', 'japan', 1685.45, -4.30, 'JPY', 8),

  // US
  makeItem('djia', 'Dow Jones', 'NYダウ', 'us', 44850.25, 165.80, 'USD', 150),
  makeItem('sp500', 'S&P 500', 'S&P 500', 'us', 6280.45, 28.15, 'USD', 25),
  makeItem('nasdaq', 'NASDAQ', 'NASDAQ総合', 'us', 20450.80, -62.35, 'USD', 80),
  makeItem('nasdaq100', 'NASDAQ 100', 'NASDAQ 100', 'us', 21680.30, -95.20, 'USD', 85),
  makeItem('russell2000', 'Russell 2000', 'Russell 2000', 'us', 2320.15, 18.40, 'USD', 15),

  // Europe
  makeItem('ftse100', 'FTSE 100', 'FTSE 100', 'europe', 8450.60, 32.50, 'GBP', 35),
  makeItem('dax', 'DAX', 'DAX', 'europe', 22150.80, -55.30, 'EUR', 75),
  makeItem('cac40', 'CAC 40', 'CAC 40', 'europe', 8280.45, 22.80, 'EUR', 35),

  // Asia
  makeItem('shanghai', 'Shanghai Comp.', '上海総合指数', 'asia', 3380.25, -8.50, 'CNY', 18),
  makeItem('hangseng', 'Hang Seng', 'ハンセン指数', 'asia', 22850.60, 210.45, 'HKD', 100),
  makeItem('kospi', 'KOSPI', 'KOSPI', 'asia', 2780.35, 16.20, 'KRW', 15),
  makeItem('taiex', 'TAIEX', '台湾加権指数', 'asia', 23450.80, 120.65, 'TWD', 95),
];

export const mockForex: MarketItem[] = [
  makeItem('usdjpy', 'USD/JPY', 'ドル円', 'forex', 150.85, 0.42, 'JPY', 0.3),
  makeItem('eurjpy', 'EUR/JPY', 'ユーロ円', 'forex', 163.42, -0.18, 'JPY', 0.3),
  makeItem('gbpjpy', 'GBP/JPY', 'ポンド円', 'forex', 192.15, 0.55, 'JPY', 0.4),
  makeItem('eurusd', 'EUR/USD', 'ユーロドル', 'forex', 1.0832, -0.0018, 'USD', 0.003),
  makeItem('audjpy', 'AUD/JPY', '豪ドル円', 'forex', 98.65, 0.22, 'JPY', 0.2),
];

export const mockCommodities: MarketItem[] = [
  makeItem('wti', 'WTI Crude', 'WTI原油', 'commodity', 72.35, -0.85, 'USD', 0.5),
  makeItem('gold', 'Gold', '金', 'commodity', 3050.40, 18.60, 'USD', 12),
  makeItem('silver', 'Silver', '銀', 'commodity', 34.20, 0.45, 'USD', 0.2),
  makeItem('copper', 'Copper', '銅', 'commodity', 4.850, 0.032, 'USD', 0.02),
  makeItem('natgas', 'Natural Gas', '天然ガス', 'commodity', 3.820, -0.045, 'USD', 0.03),
];

export const mockCrypto: MarketItem[] = [
  makeItem('btc', 'Bitcoin', 'BTC', 'crypto', 98450.20, 1850.60, 'USD', 500),
  makeItem('eth', 'Ethereum', 'ETH', 'crypto', 4250.80, -35.20, 'USD', 25),
  makeItem('xrp', 'XRP', 'XRP', 'crypto', 2.4520, 0.0380, 'USD', 0.02),
  makeItem('sol', 'Solana', 'SOL', 'crypto', 185.30, 6.80, 'USD', 3),
  makeItem('bnb', 'BNB', 'BNB', 'crypto', 720.50, -9.20, 'USD', 5),
];

export const mockSubIndicators: SubIndicator[] = [
  // Volatility
  { id: 'nikkei-vi', name: 'Nikkei VI', nameJa: '日経VI', category: 'volatility', value: 20.15, change: -0.65, changePercent: -3.12, unit: 'pt', signal: 'neutral' },
  { id: 'vix', name: 'VIX', nameJa: 'VIX (恐怖指数)', category: 'volatility', value: 16.80, change: -0.35, changePercent: -2.04, unit: 'pt', signal: 'neutral' },

  // Sentiment
  { id: 'advance-decline', name: 'Advance/Decline Ratio', nameJa: '騰落レシオ (25日)', category: 'sentiment', value: 108.5, change: 3.2, changePercent: 3.04, unit: '%', signal: 'neutral' },
  { id: 'new-highs', name: 'New Highs', nameJa: '新高値銘柄数', category: 'sentiment', value: 52, change: 8, changePercent: 18.18, unit: '', signal: 'bullish' },
  { id: 'new-lows', name: 'New Lows', nameJa: '新安値銘柄数', category: 'sentiment', value: 15, change: -3, changePercent: -16.67, unit: '', signal: 'bullish' },

  // Trading
  { id: 'short-sell-ratio', name: 'Short Sell Ratio', nameJa: '空売り比率', category: 'trading', value: 41.8, change: 0.8, changePercent: 1.95, unit: '%', signal: 'neutral' },
  { id: 'margin-buy', name: 'Margin Buy', nameJa: '信用買い残', category: 'trading', value: 4.05, change: 0.08, changePercent: 2.02, unit: '兆円', signal: 'neutral' },
  { id: 'margin-sell', name: 'Margin Sell', nameJa: '信用売り残', category: 'trading', value: 0.92, change: -0.03, changePercent: -3.16, unit: '兆円', signal: 'neutral' },

  // Valuation
  { id: 'nikkei-per', name: 'Nikkei PER', nameJa: '日経平均PER', category: 'valuation', value: 16.2, change: 0.15, changePercent: 0.93, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-pbr', name: 'Nikkei PBR', nameJa: '日経平均PBR', category: 'valuation', value: 1.42, change: 0.01, changePercent: 0.71, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-eps', name: 'Nikkei EPS', nameJa: '日経平均EPS', category: 'valuation', value: 2545.80, change: 15.20, changePercent: 0.60, unit: '円', signal: 'bullish' },

  // Bonds
  { id: 'jp10y', name: 'Japan 10Y', nameJa: '日本10年国債利回り', category: 'bonds', value: 1.425, change: 0.020, changePercent: 1.42, unit: '%', signal: 'neutral' },
  { id: 'us10y', name: 'US 10Y', nameJa: '米国10年国債利回り', category: 'bonds', value: 4.050, change: -0.025, changePercent: -0.61, unit: '%', signal: 'neutral' },
  { id: 'rate-spread', name: 'US-JP Spread', nameJa: '日米金利差', category: 'bonds', value: 2.625, change: -0.045, changePercent: -1.69, unit: '%', signal: 'neutral' },

  // Other
  { id: 'nt-ratio', name: 'NT Ratio', nameJa: 'NT倍率', category: 'other', value: 14.30, change: 0.03, changePercent: 0.21, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-usd', name: 'Nikkei USD', nameJa: 'ドル建て日経平均', category: 'other', value: 273.50, change: 2.15, changePercent: 0.79, unit: 'USD', signal: 'bullish' },
  { id: 'arb-buy', name: 'Arbitrage Buy', nameJa: '裁定買い残', category: 'other', value: 1.38, change: 0.06, changePercent: 4.55, unit: '兆円', signal: 'neutral' },
];

export const mockFearGreed: FearGreedData = {
  value: 58,
  label: 'Greed',
  vix: 16.80,
};

export const mockMarketSummary: MarketSummary = {
  text: '日経平均は前日比+285円の41,250円。NYダウ先物は+165ドル。ドル円は150.85円で推移。VIXは16.80と安定的水準。',
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
}

export const chartSymbols: ChartSymbol[] = [
  { id: 'nikkei225', name: 'Nikkei 225', nameJa: '日経平均株価' },
  { id: 'sp500', name: 'S&P 500', nameJa: 'S&P 500' },
  { id: 'nasdaq', name: 'NASDAQ', nameJa: 'NASDAQ総合' },
];

export const mockOHLCData: Record<string, OHLCDataPoint[]> = {
  nikkei225: generateOHLCData(40200, 0.012, 60),
  sp500: generateOHLCData(6150, 0.010, 60),
  nasdaq: generateOHLCData(20000, 0.015, 60),
};
