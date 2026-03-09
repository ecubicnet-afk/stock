import type { MarketItem, SubIndicator, FearGreedData, MarketSummary, DataPoint } from '../types';

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
  makeItem('nikkei225', 'Nikkei 225', '日経平均株価', 'japan', 38527.50, 352.68, 'JPY', 150),
  makeItem('topix', 'TOPIX', 'TOPIX', 'japan', 2683.45, 18.32, 'JPY', 10),
  makeItem('growth250', 'Growth 250', 'グロース250', 'japan', 682.15, -8.43, 'JPY', 5),
  makeItem('jpx400', 'JPX Nikkei 400', 'JPX日経400', 'japan', 21345.80, 125.60, 'JPY', 80),
  makeItem('tse-reit', 'TSE REIT', '東証REIT指数', 'japan', 1722.35, -5.18, 'JPY', 8),

  // US
  makeItem('djia', 'Dow Jones', 'NYダウ', 'us', 38905.66, 130.45, 'USD', 120),
  makeItem('sp500', 'S&P 500', 'S&P 500', 'us', 5104.76, 22.33, 'USD', 20),
  makeItem('nasdaq', 'NASDAQ', 'NASDAQ総合', 'us', 16128.53, -45.67, 'USD', 60),
  makeItem('nasdaq100', 'NASDAQ 100', 'NASDAQ 100', 'us', 17936.12, -78.90, 'USD', 70),
  makeItem('russell2000', 'Russell 2000', 'Russell 2000', 'us', 2052.30, 15.42, 'USD', 12),

  // Europe
  makeItem('ftse100', 'FTSE 100', 'FTSE 100', 'europe', 7706.55, 25.80, 'GBP', 30),
  makeItem('dax', 'DAX', 'DAX', 'europe', 17812.30, -42.15, 'EUR', 60),
  makeItem('cac40', 'CAC 40', 'CAC 40', 'europe', 7953.20, 18.65, 'EUR', 30),

  // Asia
  makeItem('shanghai', 'Shanghai Comp.', '上海総合指数', 'asia', 3054.68, -12.35, 'CNY', 15),
  makeItem('hangseng', 'Hang Seng', 'ハンセン指数', 'asia', 16512.92, 185.30, 'HKD', 80),
  makeItem('kospi', 'KOSPI', 'KOSPI', 'asia', 2654.80, 22.15, 'KRW', 12),
  makeItem('taiex', 'TAIEX', '台湾加権指数', 'asia', 19832.45, 95.60, 'TWD', 80),
];

export const mockForex: MarketItem[] = [
  makeItem('usdjpy', 'USD/JPY', 'ドル円', 'forex', 154.52, 0.38, 'JPY', 0.3),
  makeItem('eurjpy', 'EUR/JPY', 'ユーロ円', 'forex', 168.23, -0.15, 'JPY', 0.3),
  makeItem('gbpjpy', 'GBP/JPY', 'ポンド円', 'forex', 196.85, 0.52, 'JPY', 0.4),
  makeItem('eurusd', 'EUR/USD', 'ユーロドル', 'forex', 1.0887, -0.0023, 'USD', 0.003),
  makeItem('audjpy', 'AUD/JPY', '豪ドル円', 'forex', 101.32, 0.18, 'JPY', 0.2),
];

export const mockCommodities: MarketItem[] = [
  makeItem('wti', 'WTI Crude', 'WTI原油', 'commodity', 78.52, 1.23, 'USD', 0.5),
  makeItem('gold', 'Gold', '金', 'commodity', 2342.80, 15.60, 'USD', 8),
  makeItem('silver', 'Silver', '銀', 'commodity', 27.85, -0.32, 'USD', 0.15),
  makeItem('copper', 'Copper', '銅', 'commodity', 4.152, 0.028, 'USD', 0.02),
  makeItem('natgas', 'Natural Gas', '天然ガス', 'commodity', 2.254, -0.068, 'USD', 0.02),
];

export const mockCrypto: MarketItem[] = [
  makeItem('btc', 'Bitcoin', 'BTC', 'crypto', 67523.40, 1250.80, 'USD', 300),
  makeItem('eth', 'Ethereum', 'ETH', 'crypto', 3452.15, -28.60, 'USD', 20),
  makeItem('xrp', 'XRP', 'XRP', 'crypto', 0.6215, 0.0185, 'USD', 0.005),
  makeItem('sol', 'Solana', 'SOL', 'crypto', 148.52, 5.30, 'USD', 2),
  makeItem('bnb', 'BNB', 'BNB', 'crypto', 580.25, -8.15, 'USD', 3),
];

export const mockSubIndicators: SubIndicator[] = [
  // Volatility
  { id: 'nikkei-vi', name: 'Nikkei VI', nameJa: '日経VI', category: 'volatility', value: 18.52, change: -0.85, changePercent: -4.39, unit: 'pt', signal: 'neutral' },
  { id: 'vix', name: 'VIX', nameJa: 'VIX (恐怖指数)', category: 'volatility', value: 14.23, change: -0.42, changePercent: -2.87, unit: 'pt', signal: 'bullish' },

  // Sentiment
  { id: 'advance-decline', name: 'Advance/Decline Ratio', nameJa: '騰落レシオ (25日)', category: 'sentiment', value: 105.8, change: 2.3, changePercent: 2.22, unit: '%', signal: 'neutral' },
  { id: 'new-highs', name: 'New Highs', nameJa: '新高値銘柄数', category: 'sentiment', value: 45, change: 12, changePercent: 36.36, unit: '', signal: 'bullish' },
  { id: 'new-lows', name: 'New Lows', nameJa: '新安値銘柄数', category: 'sentiment', value: 18, change: -5, changePercent: -21.74, unit: '', signal: 'bullish' },

  // Trading
  { id: 'short-sell-ratio', name: 'Short Sell Ratio', nameJa: '空売り比率', category: 'trading', value: 42.5, change: 1.2, changePercent: 2.91, unit: '%', signal: 'bearish' },
  { id: 'margin-buy', name: 'Margin Buy', nameJa: '信用買い残', category: 'trading', value: 3.82, change: 0.05, changePercent: 1.33, unit: '兆円', signal: 'neutral' },
  { id: 'margin-sell', name: 'Margin Sell', nameJa: '信用売り残', category: 'trading', value: 0.85, change: -0.02, changePercent: -2.30, unit: '兆円', signal: 'neutral' },

  // Valuation
  { id: 'nikkei-per', name: 'Nikkei PER', nameJa: '日経平均PER', category: 'valuation', value: 15.8, change: 0.2, changePercent: 1.28, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-pbr', name: 'Nikkei PBR', nameJa: '日経平均PBR', category: 'valuation', value: 1.35, change: 0.01, changePercent: 0.75, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-eps', name: 'Nikkei EPS', nameJa: '日経平均EPS', category: 'valuation', value: 2438.50, change: 12.30, changePercent: 0.51, unit: '円', signal: 'bullish' },

  // Bonds
  { id: 'jp10y', name: 'Japan 10Y', nameJa: '日本10年国債利回り', category: 'bonds', value: 0.875, change: 0.015, changePercent: 1.74, unit: '%', signal: 'neutral' },
  { id: 'us10y', name: 'US 10Y', nameJa: '米国10年国債利回り', category: 'bonds', value: 4.325, change: -0.032, changePercent: -0.73, unit: '%', signal: 'neutral' },
  { id: 'rate-spread', name: 'US-JP Spread', nameJa: '日米金利差', category: 'bonds', value: 3.450, change: -0.047, changePercent: -1.34, unit: '%', signal: 'neutral' },

  // Other
  { id: 'nt-ratio', name: 'NT Ratio', nameJa: 'NT倍率', category: 'other', value: 14.36, change: 0.05, changePercent: 0.35, unit: '倍', signal: 'neutral' },
  { id: 'nikkei-usd', name: 'Nikkei USD', nameJa: 'ドル建て日経平均', category: 'other', value: 249.35, change: 1.85, changePercent: 0.75, unit: 'USD', signal: 'bullish' },
  { id: 'arb-buy', name: 'Arbitrage Buy', nameJa: '裁定買い残', category: 'other', value: 1.25, change: 0.08, changePercent: 6.84, unit: '兆円', signal: 'neutral' },
];

export const mockFearGreed: FearGreedData = {
  value: 62,
  label: 'Greed',
  vix: 14.23,
};

export const mockMarketSummary: MarketSummary = {
  text: '日経平均は前日比+352円の38,527円。NYダウ先物は+130ドル。ドル円は154.52円で推移。VIXは14.23と低水準を維持。',
  timestamp: new Date().toISOString(),
};
