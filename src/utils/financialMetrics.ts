/**
 * Financial metrics calculation utilities.
 * All percentage values are returned as raw numbers (e.g., -5.2 means -5.2%).
 */

export interface SnapshotForMetrics {
  date: string;
  totalAsset: number;
}

export interface FinancialMetrics {
  maxAsset: number;
  currentDrawdown: number;
  maxDrawdown: number;
  monthOverMonthGrowth: number;
  annualizedReturn: number;
  sharpeRatio: number;
  volatility: number;
}

const TRADING_DAYS_PER_YEAR = 252;

/** Daily returns as percentages: [(s[i]-s[i-1])/s[i-1] * 100] */
export function computeDailyReturns(snapshots: SnapshotForMetrics[]): number[] {
  if (snapshots.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1].totalAsset;
    if (prev === 0) { returns.push(0); continue; }
    returns.push(((snapshots[i].totalAsset - prev) / prev) * 100);
  }
  return returns;
}

/** Max drawdown (%) — largest peak-to-trough decline */
export function computeMaxDrawdown(snapshots: SnapshotForMetrics[]): number {
  if (snapshots.length < 2) return 0;
  let peak = snapshots[0].totalAsset;
  let maxDD = 0;
  for (const s of snapshots) {
    if (s.totalAsset > peak) peak = s.totalAsset;
    const dd = ((s.totalAsset - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

/** Current drawdown (%) — latest value vs running peak */
export function computeCurrentDrawdown(snapshots: SnapshotForMetrics[]): number {
  if (snapshots.length < 1) return 0;
  let peak = 0;
  for (const s of snapshots) {
    if (s.totalAsset > peak) peak = s.totalAsset;
  }
  if (peak === 0) return 0;
  const last = snapshots[snapshots.length - 1].totalAsset;
  return ((last - peak) / peak) * 100;
}

/** Drawdown series for chart — drawdown % at each point */
export function computeDrawdownSeries(snapshots: SnapshotForMetrics[]): number[] {
  if (snapshots.length === 0) return [];
  let peak = snapshots[0].totalAsset;
  return snapshots.map((s) => {
    if (s.totalAsset > peak) peak = s.totalAsset;
    return peak === 0 ? 0 : ((s.totalAsset - peak) / peak) * 100;
  });
}

/** Annualized volatility (%) — std dev of daily returns * sqrt(252) */
export function computeVolatility(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyReturns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/** Sharpe ratio — (annualized return - risk-free rate) / annualized volatility */
export function computeSharpeRatio(dailyReturns: number[], riskFreeRate = 0.1): number {
  if (dailyReturns.length < 2) return 0;
  const meanDaily = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const annualizedReturn = meanDaily * TRADING_DAYS_PER_YEAR;
  const vol = computeVolatility(dailyReturns);
  if (vol === 0) return 0;
  return (annualizedReturn - riskFreeRate) / vol;
}

/** Month-over-month growth (%) — latest vs ~30 days prior */
export function computeMonthOverMonthGrowth(snapshots: SnapshotForMetrics[]): number {
  if (snapshots.length < 2) return 0;
  const last = snapshots[snapshots.length - 1];
  const lastDate = new Date(last.date + 'T00:00:00');
  const targetDate = new Date(lastDate);
  targetDate.setDate(targetDate.getDate() - 30);
  // Find closest snapshot to 30 days ago
  let closest = snapshots[0];
  let closestDiff = Infinity;
  for (const s of snapshots) {
    if (s.date >= last.date) break;
    const diff = Math.abs(new Date(s.date + 'T00:00:00').getTime() - targetDate.getTime());
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = s;
    }
  }
  if (closest.totalAsset === 0 || closest.date === last.date) return 0;
  return ((last.totalAsset - closest.totalAsset) / closest.totalAsset) * 100;
}

/** Annualized return (%) — CAGR: ((last/first)^(365/days) - 1) * 100 */
export function computeAnnualizedReturn(snapshots: SnapshotForMetrics[]): number {
  if (snapshots.length < 2) return 0;
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  if (first.totalAsset === 0) return 0;
  const days = (new Date(last.date + 'T00:00:00').getTime() - new Date(first.date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  const ratio = last.totalAsset / first.totalAsset;
  return (Math.pow(ratio, 365 / days) - 1) * 100;
}

/** Compute all metrics at once */
export function computeAllMetrics(snapshots: SnapshotForMetrics[]): FinancialMetrics {
  const dailyReturns = computeDailyReturns(snapshots);
  return {
    maxAsset: snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.totalAsset)) : 0,
    currentDrawdown: computeCurrentDrawdown(snapshots),
    maxDrawdown: computeMaxDrawdown(snapshots),
    monthOverMonthGrowth: computeMonthOverMonthGrowth(snapshots),
    annualizedReturn: computeAnnualizedReturn(snapshots),
    sharpeRatio: computeSharpeRatio(dailyReturns),
    volatility: computeVolatility(dailyReturns),
  };
}
