'use client';
import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { DailySnapshot } from '@/src/services/firebase';
import {
  computeAllMetrics, computeDrawdownSeries,
} from '@/src/utils/financialMetrics';
import { formatJPY } from '@/src/utils/formatters';

// --- Types ---

interface ComparisonTabProps {
  history: DailySnapshot[];
  indexData: Record<string, { n225: number; topix: number; sp500: number }>;
  onDeleteSnapshot: (date: string) => void;
}

type Period = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PERIOD_DAYS: Record<Period, number> = {
  '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': 0,
};

// --- Sub-components ---

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const periods: Period[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];
  return (
    <div className="flex flex-wrap gap-1.5">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            p === value
              ? 'bg-accent-cyan text-white'
              : 'bg-bg-primary/50 text-text-secondary hover:bg-bg-primary hover:text-text-primary'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3 shadow-xl text-xs space-y-1.5">
      <div className="font-semibold text-text-primary">{label}</div>
      <div className="border-t border-border/50 pt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-text-secondary">ポートフォリオ</span>
          <span className="font-mono font-bold text-text-primary">{formatJPY(data.totalAsset)}</span>
        </div>
        {data.dailyChange !== undefined && data.dailyChange !== 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">日次変動</span>
            <span className={`font-mono ${data.dailyChange >= 0 ? 'text-up' : 'text-down'}`}>
              {data.dailyChange >= 0 ? '+' : ''}{data.dailyChange.toLocaleString()}
              <span className="ml-1">({data.dailyChangePercent >= 0 ? '+' : ''}{data.dailyChangePercent.toFixed(2)}%)</span>
            </span>
          </div>
        )}
      </div>
      <div className="border-t border-border/50 pt-1.5 space-y-0.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex justify-between gap-4">
            <span style={{ color: entry.stroke }} className="flex items-center gap-1">
              <span className="w-2 h-0.5 inline-block rounded" style={{ backgroundColor: entry.stroke }} />
              {entry.name}
            </span>
            <span className="font-mono text-text-primary">{Number(entry.value).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export function ComparisonTab({ history, indexData, onDeleteSnapshot }: ComparisonTabProps) {
  const [period, setPeriod] = useState<Period>('ALL');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter history by period
  const filteredHistory = useMemo(() => {
    if (period === 'ALL' || history.length === 0) return history;
    const days = PERIOD_DAYS[period];
    const lastDate = new Date(history[history.length - 1].date + 'T00:00:00');
    const cutoff = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return history.filter((h) => h.date >= cutoffStr);
  }, [history, period]);

  // Comparison chart data
  const comparisonHistory = useMemo(() => {
    if (filteredHistory.length === 0) return [];
    const base = filteredHistory[0];
    const baseIndex = indexData[base.date] || { n225: 1, topix: 1, sp500: 1 };
    const drawdowns = computeDrawdownSeries(filteredHistory);
    return filteredHistory.map((curr, i) => {
      const idx = indexData[curr.date] || { n225: 0, topix: 0, sp500: 0 };
      const dailyChange = i > 0 ? curr.totalAsset - filteredHistory[i - 1].totalAsset : 0;
      return {
        ...curr,
        dailyChange,
        dailyChangePercent: i > 0 ? (dailyChange / filteredHistory[i - 1].totalAsset) * 100 : 0,
        portfolioNorm: (curr.totalAsset / base.totalAsset) * 100,
        n225Norm: idx.n225 && baseIndex.n225 ? (idx.n225 / baseIndex.n225) * 100 : null,
        topixNorm: idx.topix && baseIndex.topix ? (idx.topix / baseIndex.topix) * 100 : null,
        sp500Norm: idx.sp500 && baseIndex.sp500 ? (idx.sp500 / baseIndex.sp500) * 100 : null,
        drawdown: drawdowns[i],
        cumulativeReturn: ((curr.totalAsset / history[0].totalAsset) - 1) * 100,
      };
    });
  }, [filteredHistory, indexData, history]);

  // Metrics
  const metrics = useMemo(() => computeAllMetrics(filteredHistory), [filteredHistory]);

  // Asset mix data
  const assetMixData = useMemo(() => {
    return filteredHistory
      .filter((h) => h.cashAmount != null || h.spotAmount != null || h.marginAmount != null)
      .map((h) => ({
        date: h.date,
        cash: h.cashAmount ?? 0,
        spot: h.spotAmount ?? 0,
        margin: h.marginAmount ?? 0,
      }));
  }, [filteredHistory]);

  const hasIndexData = filteredHistory.length > 0 && !!indexData[filteredHistory[0]?.date];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <PeriodSelector value={period} onChange={setPeriod} />
        <span className="text-[10px] text-text-secondary/60">
          {filteredHistory.length}日間のデータ
        </span>
      </div>

      {/* Primary stats cards */}
      {filteredHistory.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-up/10 border border-up/20 rounded-lg p-3">
              <p className="text-xs text-text-secondary mb-1">最高資産額</p>
              <p className="text-lg font-bold text-up font-mono">{formatJPY(metrics.maxAsset)}</p>
            </div>
            <div className={`${metrics.currentDrawdown < -1 ? 'bg-down/10 border-down/20' : 'bg-bg-primary/30 border-border'} border rounded-lg p-3`}>
              <p className="text-xs text-text-secondary mb-1">現在のドローダウン</p>
              <p className={`text-lg font-bold font-mono ${metrics.currentDrawdown < 0 ? 'text-down' : 'text-text-primary'}`}>
                {metrics.currentDrawdown.toFixed(2)}%
              </p>
            </div>
            <div className={`${metrics.monthOverMonthGrowth >= 0 ? 'bg-accent-cyan/10 border-accent-cyan/20' : 'bg-down/10 border-down/20'} border rounded-lg p-3`}>
              <p className="text-xs text-text-secondary mb-1">前月比成長率</p>
              <p className={`text-lg font-bold font-mono ${metrics.monthOverMonthGrowth >= 0 ? 'text-up' : 'text-down'}`}>
                {metrics.monthOverMonthGrowth >= 0 ? '+' : ''}{metrics.monthOverMonthGrowth.toFixed(2)}%
              </p>
            </div>
            <div className={`${metrics.annualizedReturn >= 0 ? 'bg-accent-gold/10 border-accent-gold/20' : 'bg-down/10 border-down/20'} border rounded-lg p-3`}>
              <p className="text-xs text-text-secondary mb-1">年間期待利回り</p>
              <p className={`text-lg font-bold font-mono ${metrics.annualizedReturn >= 0 ? 'text-up' : 'text-down'}`}>
                {metrics.annualizedReturn >= 0 ? '+' : ''}{metrics.annualizedReturn.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Advanced metrics toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-text-secondary/60 hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            詳細指標
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-bg-primary/30 border border-border rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">シャープレシオ</p>
                <p className={`text-lg font-bold font-mono ${metrics.sharpeRatio >= 1 ? 'text-up' : metrics.sharpeRatio >= 0 ? 'text-text-primary' : 'text-down'}`}>
                  {metrics.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <div className="bg-bg-primary/30 border border-border rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">最大ドローダウン</p>
                <p className="text-lg font-bold font-mono text-down">
                  {metrics.maxDrawdown.toFixed(2)}%
                </p>
              </div>
              <div className="bg-bg-primary/30 border border-border rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">ボラティリティ (年率)</p>
                <p className="text-lg font-bold font-mono text-text-primary">
                  {metrics.volatility.toFixed(2)}%
                </p>
              </div>
              <div className="bg-bg-primary/30 border border-border rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">記録日数</p>
                <p className="text-lg font-bold text-text-primary font-mono">
                  {filteredHistory.length} <span className="text-xs">日間</span>
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Performance chart */}
      <div className="bg-bg-primary/30 rounded-lg p-3">
        {comparisonHistory.length > 0 ? (
          <div className="space-y-0">
            {/* Main chart */}
            <div className="h-[300px]">
              <ResponsiveContainer>
                <LineChart data={comparisonHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={30} />
                  <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="portfolioNorm" name="MY資産" stroke="#0e7490" strokeWidth={2.5} dot={{ r: 3, fill: '#0e7490' }} />
                  {hasIndexData && (
                    <>
                      <Line type="monotone" dataKey="n225Norm" name="日経平均" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
                      <Line type="monotone" dataKey="topixNorm" name="TOPIX" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="3 3" dot={false} connectNulls />
                      <Line type="monotone" dataKey="sp500Norm" name="S&P500" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown chart */}
            <div className="h-[100px] mt-1">
              <ResponsiveContainer>
                <AreaChart data={comparisonHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    domain={['auto', 0]}
                    tickFormatter={(v) => `${v.toFixed(1)}%`}
                  />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toFixed(2)}%`, 'ドローダウン']}
                    contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.3} />
                  <Area type="monotone" dataKey="drawdown" stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-text-secondary/50 text-sm italic">
            履歴がありません。CSVをアップロードして「記録を保存」してください。
          </div>
        )}
      </div>

      {/* Asset mix chart */}
      {assetMixData.length >= 2 ? (
        <div className="bg-bg-primary/30 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-text-secondary mb-2">資産構成推移</h4>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <AreaChart data={assetMixData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  formatter={(v, name) => [formatJPY(Number(v)), String(name)]}
                  contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend verticalAlign="top" height={30} />
                <Area type="monotone" dataKey="spot" name="株式現物" stackId="1" stroke="#0e7490" fill="#0e7490" fillOpacity={0.6} />
                <Area type="monotone" dataKey="margin" name="信用" stackId="1" stroke="#b8860b" fill="#b8860b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="cash" name="現金" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : filteredHistory.length > 0 && (
        <div className="bg-bg-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-text-secondary/50 italic">
            新しい記録から資産構成データが蓄積されます
          </p>
        </div>
      )}

      {/* History table */}
      {comparisonHistory.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-text-secondary text-xs border-b border-border">
              <tr>
                <th className="pb-2 px-3">日付</th>
                <th className="pb-2 px-3 text-right">総資産</th>
                <th className="pb-2 px-3 text-right">前日比</th>
                <th className="pb-2 px-3 text-right">DD%</th>
                <th className="pb-2 px-3 text-right">累積</th>
                <th className="pb-2 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {[...comparisonHistory].reverse().map((h, i) => (
                <tr
                  key={i}
                  className={`hover:bg-bg-primary/30 border-l-2 ${
                    h.dailyChange > 0 ? 'border-l-up' : h.dailyChange < 0 ? 'border-l-down' : 'border-l-transparent'
                  }`}
                >
                  <td className="py-2.5 px-3 text-text-secondary">{h.date}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-text-primary">
                    ¥{h.totalAsset.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-right ${h.dailyChange >= 0 ? 'text-up' : 'text-down'}`}>
                    {h.dailyChange >= 0 ? '+' : ''}{h.dailyChange.toLocaleString()}
                    <span className="text-xs ml-1">({h.dailyChangePercent >= 0 ? '+' : ''}{h.dailyChangePercent.toFixed(2)}%)</span>
                  </td>
                  <td className={`py-2.5 px-3 text-right text-xs ${h.drawdown < -1 ? 'text-down' : 'text-text-secondary'}`}>
                    {h.drawdown.toFixed(1)}%
                  </td>
                  <td className={`py-2.5 px-3 text-right text-xs ${h.cumulativeReturn >= 0 ? 'text-up' : 'text-down'}`}>
                    {h.cumulativeReturn >= 0 ? '+' : ''}{h.cumulativeReturn.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => onDeleteSnapshot(h.date)} className="text-text-secondary/40 hover:text-down">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
