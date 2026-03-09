import { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { readFileAsText, parseTradeAnalysisCSV } from '../utils/csvParser';
import type { AnalysisTrade } from '../utils/csvParser';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { lookupMaxRisk } from '../utils/riskTable';
import { formatJPY } from '../utils/formatters';

export interface SelectedCsvTrade {
  date: string;
  ticker: string;
  name: string;
  profit: number;
  quantity: number;
  price: number;
}

interface AnalysisProps {
  onSelectTrade?: (trade: SelectedCsvTrade) => void;
}

interface FileInfo {
  name: string;
  count: number;
}

interface AnalysisResult {
  winRate: number;
  rrRatio: number;
  netProfit: number;
  profitFactor: number;
  maxRisk: number | null;
  winCount: number;
  lossCount: number;
  chartData: (AnalysisTrade & { cumulative: number })[];
  monthlyData: { month: string; profit: number; winRate: number; rrRatio: number; count: number }[];
  stockData: {
    id: string; total: number; count: number; winCount: number; lossCount: number;
    winTotal: number; lossTotal: number; name: string; ticker: string; winRate: number; rrRatio: number;
  }[];
}

function computeAnalysis(data: AnalysisTrade[]): AnalysisResult | null {
  if (data.length === 0) return null;
  const wins = data.filter((t) => t.profit > 0);
  const losses = data.filter((t) => t.profit < 0);
  const winCount = wins.length;
  const lossCount = losses.length;
  const totalProfit = wins.reduce((sum, t) => sum + t.profit, 0);
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0));
  const avgWin = winCount > 0 ? totalProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;

  let currentSum = 0;
  const chartData = data.map((t) => {
    currentSum += t.profit;
    return { ...t, cumulative: currentSum };
  });

  const monthlyMap: Record<string, { profit: number; wins: number; losses: number; winTotal: number; lossTotal: number }> = {};
  data.forEach((t) => {
    if (!monthlyMap[t.month]) monthlyMap[t.month] = { profit: 0, wins: 0, losses: 0, winTotal: 0, lossTotal: 0 };
    monthlyMap[t.month].profit += t.profit;
    if (t.profit > 0) { monthlyMap[t.month].wins += 1; monthlyMap[t.month].winTotal += t.profit; }
    else { monthlyMap[t.month].losses += 1; monthlyMap[t.month].lossTotal += Math.abs(t.profit); }
  });
  const monthlyData = Object.entries(monthlyMap)
    .map(([month, s]) => {
      const total = s.wins + s.losses;
      const wr = total > 0 ? (s.wins / total) * 100 : 0;
      const mAvgWin = s.wins > 0 ? s.winTotal / s.wins : 0;
      const mAvgLoss = s.losses > 0 ? s.lossTotal / s.losses : 0;
      return { month, profit: s.profit, winRate: wr, rrRatio: mAvgLoss > 0 ? mAvgWin / mAvgLoss : 0, count: total };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  const stockMap: Record<string, { total: number; count: number; winCount: number; lossCount: number; winTotal: number; lossTotal: number; name: string; ticker: string }> = {};
  data.forEach((t) => {
    const id = t.ticker ? `${t.ticker} ${t.name}` : t.name;
    if (!stockMap[id]) stockMap[id] = { total: 0, count: 0, winCount: 0, lossCount: 0, winTotal: 0, lossTotal: 0, name: t.name, ticker: t.ticker };
    stockMap[id].total += t.profit;
    stockMap[id].count += 1;
    if (t.profit > 0) { stockMap[id].winCount += 1; stockMap[id].winTotal += t.profit; }
    else { stockMap[id].lossCount += 1; stockMap[id].lossTotal += Math.abs(t.profit); }
  });
  const stockData = Object.entries(stockMap)
    .map(([id, s]) => {
      const wr = s.count > 0 ? (s.winCount / s.count) * 100 : 0;
      const aW = s.winCount > 0 ? s.winTotal / s.winCount : 0;
      const aL = s.lossCount > 0 ? s.lossTotal / s.lossCount : 0;
      return { id, ...s, winRate: wr, rrRatio: aL > 0 ? aW / aL : 0 };
    })
    .sort((a, b) => b.total - a.total);

  const wr = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0;

  return {
    winRate: wr, rrRatio: rr, netProfit: totalProfit - totalLoss,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 99.9,
    maxRisk: lookupMaxRisk(wr, rr), winCount, lossCount, chartData, monthlyData, stockData,
  };
}

function SummaryStats({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <div className="text-xs font-semibold text-text-secondary mb-1">全体勝率</div>
        <div className="text-xl font-bold text-text-primary">{analysis.winRate.toFixed(1)}%</div>
        <div className="text-xs text-text-secondary mt-1">{analysis.winCount}勝 / {analysis.lossCount}負</div>
      </div>
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <div className="text-xs font-semibold text-text-secondary mb-1">全体RR比</div>
        <div className="text-xl font-bold text-text-primary">{analysis.rrRatio.toFixed(2)}</div>
        <div className="text-xs text-text-secondary mt-1">平均利 / 平均損</div>
      </div>
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <div className="text-xs font-semibold text-text-secondary mb-1">プロフィットファクター</div>
        <div className="text-xl font-bold text-text-primary">{analysis.profitFactor.toFixed(2)}</div>
        <div className="text-xs text-text-secondary mt-1">総利益 / 総損失</div>
      </div>
      <div className={`backdrop-blur-sm border rounded-xl p-4 text-center ${analysis.netProfit >= 0 ? 'bg-up/10 border-up/30' : 'bg-down/10 border-down/30'}`}>
        <div className="text-xs font-semibold text-text-secondary mb-1">合計純損益</div>
        <div className={`text-xl font-bold ${analysis.netProfit >= 0 ? 'text-up' : 'text-down'}`}>
          {formatJPY(analysis.netProfit)}
        </div>
      </div>
      <div className="bg-accent-gold/5 backdrop-blur-sm border border-accent-gold/30 rounded-xl p-4 text-center">
        <div className="text-xs font-semibold text-accent-gold mb-1">限界リスク</div>
        <div className="text-xl font-bold text-accent-gold">
          {analysis.maxRisk !== null ? `${analysis.maxRisk}%` : '-'}
        </div>
        <div className="text-[10px] text-text-secondary mt-1">破産基準-30% / 1回あたり</div>
      </div>
    </div>
  );
}

function EquityCurve({ chartData }: { chartData: AnalysisResult['chartData'] }) {
  return (
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-accent-gold flex items-center gap-2 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        資産推移（累積損益）
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis tickFormatter={(v) => `${Math.round(v / 10000).toLocaleString()}万`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              formatter={(v) => [formatJPY(Number(v)), '累計']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line type="monotone" dataKey="cumulative" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MonthlyPerformance({ monthlyData }: { monthlyData: AnalysisResult['monthlyData'] }) {
  return (
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-accent-gold flex items-center gap-2 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        月別パフォーマンス
      </h3>
      <div className="h-[200px] w-full mb-3">
        <ResponsiveContainer>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
            <YAxis tickFormatter={(v) => `${Math.round(v / 10000).toLocaleString()}万`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} width={60} />
            <Tooltip
              formatter={(v) => [formatJPY(Number(v)), '月間損益']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
            />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.profit > 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
        {monthlyData.slice().reverse().map((m, i) => (
          <div key={i} className="bg-bg-primary/30 p-2.5 rounded-lg flex flex-col gap-1">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-text-primary">{m.month}</span>
              <span className={m.profit > 0 ? 'text-up' : 'text-down'}>{formatJPY(m.profit)}</span>
            </div>
            <div className="flex justify-around text-xs text-text-secondary">
              <span>回数: {m.count}</span>
              <span>勝率: {m.winRate.toFixed(1)}%</span>
              <span>RR: {m.rrRatio.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockBreakdown({ stockData }: { stockData: AnalysisResult['stockData'] }) {
  return (
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-accent-gold flex items-center gap-2 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        銘柄別詳細
      </h3>
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {stockData.map((s, i) => (
          <div key={i} className="bg-bg-primary/30 p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono bg-bg-primary text-text-secondary px-1 py-0.5 rounded">{i + 1}</span>
                  {s.ticker && (
                    <span className="text-xs font-mono bg-accent-cyan/10 text-accent-cyan px-1.5 py-0.5 rounded">
                      #{s.ticker}
                    </span>
                  )}
                  <span className="text-sm font-medium text-text-primary">{s.name}</span>
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {s.count}回 ({s.winCount}勝 {s.lossCount}負)
                </div>
              </div>
              <span className={`font-mono text-sm font-bold ${s.total > 0 ? 'text-up' : 'text-down'}`}>
                {s.total.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-bg-primary/50 p-1.5 rounded flex justify-between text-xs">
                <span className="text-text-secondary">勝率</span>
                <span className="font-mono text-text-primary">{s.winRate.toFixed(1)}%</span>
              </div>
              <div className="bg-bg-primary/50 p-1.5 rounded flex justify-between text-xs">
                <span className="text-text-secondary">RR比</span>
                <span className="font-mono text-text-primary">{s.rrRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeDetailTable({ data, onSelectTrade }: { data: AnalysisTrade[]; onSelectTrade?: (trade: SelectedCsvTrade) => void }) {
  return (
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-accent-gold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          取引明細
        </h3>
        <div className="flex items-center gap-2">
          {onSelectTrade && <span className="text-[10px] text-accent-gold/60">行をクリックで日誌に記録</span>}
          <span className="text-xs text-text-secondary bg-bg-primary px-2 py-0.5 rounded">
            {data.length} TRADES
          </span>
        </div>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-bg-secondary text-text-secondary text-xs">
            <tr>
              <th className="px-4 py-2.5">約定日</th>
              <th className="px-4 py-2.5 text-center">コード</th>
              <th className="px-4 py-2.5">銘柄</th>
              <th className="px-4 py-2.5 text-right">数量</th>
              <th className="px-4 py-2.5 text-right">単価</th>
              <th className="px-4 py-2.5 text-right">損益[円]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.slice().reverse().map((t, idx) => (
              <tr
                key={idx}
                className={`hover:bg-bg-primary/30 ${onSelectTrade ? 'cursor-pointer hover:bg-accent-gold/5' : ''}`}
                onClick={() => onSelectTrade?.({ date: t.date, ticker: t.ticker, name: t.name, profit: t.profit, quantity: t.quantity, price: t.price })}
              >
                <td className="px-4 py-2.5 text-text-secondary font-mono">{t.date}</td>
                <td className="px-4 py-2.5 text-center font-mono text-text-secondary">{t.ticker || '-'}</td>
                <td className="px-4 py-2.5 text-text-primary">{t.name}</td>
                <td className="px-4 py-2.5 text-right font-mono text-text-secondary">{t.quantity > 0 ? t.quantity.toLocaleString() : '-'}</td>
                <td className="px-4 py-2.5 text-right font-mono text-text-secondary">{t.price > 0 ? t.price.toLocaleString() : '-'}</td>
                <td className={`px-4 py-2.5 text-right font-mono font-bold ${t.profit > 0 ? 'text-up' : 'text-down'}`}>
                  {t.profit > 0 ? '+' : ''}{t.profit.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TradeAnalysisContent({ onSelectTrade }: AnalysisProps = {}) {
  const [data, setData] = useLocalStorage<AnalysisTrade[]>('stock-app-trade-analysis', []);
  const [loadedFiles, setLoadedFiles] = useLocalStorage<FileInfo[]>('stock-app-trade-files', []);
  const [error, setError] = useState('');

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      setError('');
      let newTradesBuffer: AnalysisTrade[] = [];
      const newFileInfos: FileInfo[] = [];

      for (const file of files) {
        if (loadedFiles.some((f) => f.name === file.name)) continue;
        try {
          const text = await readFileAsText(file);
          const trades = parseTradeAnalysisCSV(text, file.name);
          if (trades.length > 0) {
            newTradesBuffer = [...newTradesBuffer, ...trades];
            newFileInfos.push({ name: file.name, count: trades.length });
          }
        } catch {
          setError(`${file.name}の読み込み中にエラーが発生しました。`);
        }
      }

      if (newTradesBuffer.length > 0) {
        const combined = [...data, ...newTradesBuffer];
        const uniqueMap = new Map<string, AnalysisTrade>();
        combined.forEach((t) => uniqueMap.set(t.key, t));
        const uniqueData = Array.from(uniqueMap.values());
        uniqueData.sort(
          (a, b) =>
            new Date(a.date.replace(/\//g, '-')).getTime() -
            new Date(b.date.replace(/\//g, '-')).getTime()
        );
        setData(uniqueData);
        setLoadedFiles((prev) => [...prev, ...newFileInfos]);
      } else if (files.length > 0 && newFileInfos.length === 0) {
        setError('有効な取引データが見つかりませんでした。');
      }

      event.target.value = '';
    },
    [data, loadedFiles]
  );

  const clearData = () => {
    setData([]);
    setLoadedFiles([]);
    setError('');
  };

  const analysis = useMemo(() => computeAnalysis(data), [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">楽天証券CSV統合：約定日ベース分析</p>
        <div className="flex gap-2">
          {data.length > 0 && (
            <button
              onClick={clearData}
              className="px-3 py-1.5 bg-bg-card/70 border border-border text-text-secondary text-sm rounded-lg hover:bg-bg-card"
            >
              リセット
            </button>
          )}
          <label className="flex items-center gap-2 bg-accent-cyan/20 text-accent-cyan px-4 py-1.5 rounded-lg cursor-pointer hover:bg-accent-cyan/30 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            CSVを追加
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" multiple />
          </label>
        </div>
      </div>

      {loadedFiles.length > 0 && (
        <div className="bg-bg-card/70 border border-border rounded-xl p-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-text-secondary mr-2">読み込み済み:</span>
          {loadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-1 bg-up/10 text-up px-2 py-0.5 rounded text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {file.name} ({file.count}件)
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-down/10 border border-down/30 p-3 rounded-lg text-down text-sm">{error}</div>
      )}

      {analysis ? (
        <>
          <SummaryStats analysis={analysis} />
          <EquityCurve chartData={analysis.chartData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyPerformance monthlyData={analysis.monthlyData} />
            <StockBreakdown stockData={analysis.stockData} />
          </div>
          <TradeDetailTable data={data} onSelectTrade={onSelectTrade} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-bg-card/70 border border-border rounded-xl border-dashed">
          <svg className="w-12 h-12 text-accent-cyan/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-text-primary">CSVファイルを読み込んでください</h2>
          <p className="text-sm text-text-secondary mt-2 text-center max-w-sm">
            楽天証券の実現損益CSVから月別・銘柄別のパフォーマンスを詳細に分析します。
          </p>
        </div>
      )}
    </div>
  );
}
