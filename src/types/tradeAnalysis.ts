// 楽天証券 実現損益CSV から解析されるトレードデータ
export interface RakutenTrade {
  settlementDate: string;   // 約定日
  ticker: string;           // 銘柄コード
  tickerName: string;       // 銘柄名
  side: 'buy' | 'sell';     // 売買区分
  quantity: number;          // 数量
  price: number;             // 約定単価
  amount: number;            // 約定金額
  realizedPnl: number;       // 実現損益
  commission: number;        // 手数料
  tax: number;               // 税金
  netPnl: number;            // 純損益（実現損益 - 手数料 - 税金）
}

// 分析サマリー
export interface TradeAnalysisSummary {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;            // %
  averageWin: number;
  averageLoss: number;
  rrRatio: number;            // リスクリワード比
  profitFactor: number;
  totalProfit: number;
  totalLoss: number;
  netPnl: number;
  maxWin: number;
  maxLoss: number;
}

// 月次パフォーマンス
export interface MonthlyPerformance {
  month: string;             // "2026-01"
  pnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  rrRatio: number;
}

// 銘柄別パフォーマンス
export interface StockPerformance {
  ticker: string;
  tickerName: string;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  rrRatio: number;
  averageWin: number;
  averageLoss: number;
}

// 累積損益データ点
export interface EquityPoint {
  index: number;
  date: string;
  pnl: number;
  cumulative: number;
}
