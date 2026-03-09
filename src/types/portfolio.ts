// 保有銘柄（CSV解析後）
export interface Holding {
  ticker: string;
  tickerName: string;
  quantity: number;
  averageCost: number;       // 平均取得単価
  currentPrice: number;      // 現在値
  marketValue: number;       // 評価額
  costBasis: number;         // 取得総額
  unrealizedPnl: number;     // 含み損益
  unrealizedPnlPercent: number;
  weight: number;            // ポートフォリオ内ウェイト (%)
  accountType: 'spot' | 'margin';
}

// ポートフォリオサマリー
export interface PortfolioSummary {
  totalMarketValue: number;      // 総評価額
  totalCostBasis: number;        // 総取得額
  totalUnrealizedPnl: number;    // 総含み損益
  totalUnrealizedPnlPercent: number;
  holdingCount: number;
  spotValue: number;             // 現物合計
  marginValue: number;           // 信用合計
  leverage: number;              // レバレッジ (total / spot equity)
}

// セクター分析結果
export interface SectorAllocation {
  sector: string;
  sectorJa: string;
  value: number;
  weight: number;
  holdings: { ticker: string; tickerName: string; value: number }[];
}

// 日次スナップショット（Firebase保存用）
export interface DailySnapshot {
  date: string;
  totalValue: number;
  totalCost: number;
  unrealizedPnl: number;
  holdingCount: number;
  leverage: number;
  timestamp: number;
}

// パフォーマンス比較データ点
export interface PerformancePoint {
  date: string;
  portfolio: number;        // % change from start
  nikkei225?: number;
  topix?: number;
}

// Firebase設定
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 円グラフ用データ
export interface PieChartEntry {
  name: string;
  value: number;
  ticker?: string;
}
