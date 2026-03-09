import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', labelJa: 'ダッシュボード', icon: 'dashboard' },
  { path: '/chart', label: 'Chart', labelJa: 'チャート', icon: 'chart' },
  { path: '/memo', label: 'Notes & Schedule', labelJa: 'メモ & スケジュール', icon: 'memo' },
  { path: '/journal', label: 'Trade', labelJa: 'トレード', icon: 'tradeAnalysis' },

  { path: '/portfolio', label: 'Portfolio', labelJa: '資産管理', icon: 'portfolio' },
];

export const MARKET_HOURS = {
  tokyo: { open: 9, close: 15, timezone: 'Asia/Tokyo', name: '東京' },
  ny: { open: 9.5, close: 16, timezone: 'America/New_York', name: 'NY' },
  london: { open: 8, close: 16.5, timezone: 'Europe/London', name: 'ロンドン' },
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  japan: '日本市場',
  us: '米国市場',
  europe: '欧州市場',
  asia: 'アジア市場',
  forex: '為替',
  commodity: 'コモディティ',
  crypto: '仮想通貨',
  volatility: 'ボラティリティ',
  sentiment: '市場センチメント',
  trading: '売買動向',
  valuation: 'バリュエーション',
  bonds: '債券',
  other: 'その他',
};
