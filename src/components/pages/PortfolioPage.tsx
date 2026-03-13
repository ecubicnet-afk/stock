'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useSettings } from '@/src/hooks/useSettings';
import { usePortfolio, type HoldingItem } from '@/src/hooks/usePortfolio';
import { fetchSectorClassification, fetchIndexData } from '@/src/services/geminiApi';
import { saveSnapshot, loadSnapshots, deleteSnapshot } from '@/src/services/firebase';
import { readFileAsText } from '@/src/utils/csvParser';
import { CsvUploader } from '@/src/components/portfolio/CsvUploader';

// Extended type for merged view (types is non-serializable Set, used only in-memory)
interface MergedHoldingItem extends HoldingItem {
  types?: Set<string>;
}

interface DailySnapshot {
  date: string;
  totalAsset: number;
  totalProfit: number;
  timestamp: number;
}

// --- Utils ---
const cleanValue = (val: string) => String(val || '').replace(/["',円%+\s]/g, '').trim();
const parseNumber = (val: string) => {
  const cleaned = cleanValue(val);
  if (cleaned === '' || cleaned === '-') return 0;
  return parseFloat(cleaned) || 0;
};

function splitCSVLine(line: string): string[] {
  if (!line) return [];
  const result: string[] = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result.map((v) => v.replace(/^"|"$/g, '').trim());
}

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#94a3b8'];


// --- Custom Pie Label ---
function CustomPieLabel({ cx, cy, midAngle, outerRadius, percent, name }: any) {
  const RADIAN = Math.PI / 180;
  const cos = Math.cos(-RADIAN * midAngle);
  const sin = Math.sin(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 20;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  if (percent < 0.02) return null;
  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#64748b" fill="none" strokeWidth={1} />
      <circle cx={ex} cy={ey} r={2} fill="#64748b" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={4} textAnchor={textAnchor} fill="#e2e8f0" style={{ fontSize: '10px', fontWeight: 600 }}>
        {`${name} (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
}

export function PortfolioPage() {
  const { settings } = useSettings();
  const { holdings: data, summaryTotals, setHoldings, setSummaryTotal } = usePortfolio();
  const [files, setFiles] = useState<Record<string, File | null>>({ spot1: null, spot2: null, margin: null });
  const [history, setHistory] = useState<DailySnapshot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [sortConfig, setSortConfig] = useState({ key: 'marketValue', direction: 'desc' as 'asc' | 'desc' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [indexData, setIndexData] = useState<Record<string, { n225: number; topix: number }>>({});
  const [enrichedData, setEnrichedData] = useState<Record<string, { sector: string }>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  // Load history on mount
  useEffect(() => {
    loadSnapshots(settings).then(setHistory).catch(console.error);
  }, [settings]);

  // CSV Parser
  const parseFile = useCallback((text: string, type: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');

    if (type.startsWith('spot')) {
      // 既存のholdingsをクリア（CSVに保有商品がない場合に古いデータが残るのを防止）
      setHoldings(type, []);
      for (const line of lines) {
        const cells = splitCSVLine(line);
        if (cells.includes('資産合計')) {
          setSummaryTotal(type, parseNumber(cells[cells.indexOf('資産合計') + 1]));
          break;
        }
      }
      const headerIdx = lines.findIndex((l) => l.includes('銘柄コード') && (l.includes('現在値') || l.includes('評価額')));
      if (headerIdx !== -1) {
        const header = splitCSVLine(lines[headerIdx]);
        const parsed = lines.slice(headerIdx + 1).filter((l) => l.includes(',')).map((line) => {
          const cells = splitCSVLine(line);
          const obj: Record<string, string> = {};
          header.forEach((h, i) => (obj[h] = cells[i]));
          return {
            code: obj['銘柄コード・ティッカー'] || obj['銘柄コード'] || cells[1] || '',
            name: obj['銘柄'] || obj['銘柄名'] || cells[2] || '',
            price: parseNumber(obj['現在値'] || obj['現在値[円]'] || obj['現在値［円］'] || ''),
            quantity: parseNumber(obj['数量'] || obj['保有数量'] || ''),
            marketValue: parseNumber(obj['時価評価額[円]'] || obj['時価評価額［円］'] || ''),
            profit: parseNumber(obj['評価損益[円]'] || obj['評価損益額［円］'] || ''),
            profitRate: parseNumber(obj['評価損益[％]'] || obj['評価損益率［％］'] || ''),
            type: '現物',
          };
        }).filter((item) => item.code && item.marketValue > 0);
        setHoldings(type, parsed);
        addLog(`${type}: ${parsed.length}件の保有資産を抽出。`);
      }
    } else {
      // 既存のholdingsをクリア
      setHoldings('margin', []);
      for (const line of lines) {
        const cells = splitCSVLine(line);
        if (cells.includes('合計[円]') || cells.includes('合計［円］')) {
          const idx = cells.findIndex((c) => c.includes('合計'));
          setSummaryTotal('margin', parseNumber(cells[idx + 1]));
          break;
        }
      }
      const marginHeaderIdx = lines.findIndex((l) => l.includes('銘柄コード') && (l.includes('建玉') || l.includes('時価')));
      if (marginHeaderIdx !== -1) {
        const header = splitCSVLine(lines[marginHeaderIdx]);
        const parsed = lines.slice(marginHeaderIdx + 1).filter((l) => l.includes(',')).map((line) => {
          const cells = splitCSVLine(line);
          const obj: Record<string, string> = {};
          header.forEach((h, i) => (obj[h] = cells[i]));
          return {
            code: obj['銘柄コード'] || cells[1] || '',
            name: obj['銘柄名'] || obj['銘柄'] || cells[2] || '',
            price: parseNumber(obj['現在値'] || obj['現在値［円］'] || obj['現在値[円]'] || ''),
            quantity: parseNumber(obj['数量'] || obj['建株数'] || obj['建数量'] || ''),
            marketValue: parseNumber(obj['時価評価額［円］'] || obj['時価評価額[円]'] || ''),
            profit: parseNumber(obj['評価損益額［円］'] || obj['評価損益額[円]'] || ''),
            profitRate: parseNumber(obj['評価損益率［％］'] || obj['評価損益率[％]'] || ''),
            type: '信用',
          };
        }).filter((item) => item.code && item.marketValue > 0);
        setHoldings('margin', parsed);
        addLog(`Margin: ${parsed.length}件の信用建玉を抽出。`);
      }
    }
  }, []);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    let spotCount = 0;
    const newFiles = { ...files };

    for (const file of uploadedFiles) {
      const fileName = file.name.toLowerCase();
      const type = fileName.includes('marginbalance') ? 'margin' : spotCount++ === 0 ? 'spot1' : 'spot2';
      newFiles[type] = file;

      try {
        const text = await readFileAsText(file);
        parseFile(text, type);
      } catch (err) {
        addLog(`Error: ${file.name} の読み込みに失敗`);
      }

      const dateMatch = file.name.match(/(\d{8})/);
      if (dateMatch) {
        const d = dateMatch[0];
        setSelectedDate(`${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`);
      }
    }
    setFiles(newFiles);
  };

  // Aggregated data
  const aggregatedData = useMemo(() => {
    const combined = [...data.spot1, ...data.spot2, ...data.margin];
    const map = new Map<string, MergedHoldingItem & { types: Set<string> }>();
    combined.forEach((item) => {
      const code = String(item.code);
      const attr = enrichedData[code] || { sector: '未分類' };
      if (!map.has(code)) {
        map.set(code, { ...item, sector: attr.sector, types: new Set([item.type]) });
      } else {
        const existing = map.get(code)!;
        existing.quantity += item.quantity;
        existing.marketValue += item.marketValue;
        existing.profit += item.profit;
        existing.price = item.price || existing.price;
        existing.types.add(item.type);
      }
    });
    const result = Array.from(map.values());
    const totalMarketValue = result.reduce((sum, item) => sum + item.marketValue, 0);
    return result
      .map((item) => ({
        ...item,
        portfolioWeight: totalMarketValue > 0 ? (item.marketValue / totalMarketValue) * 100 : 0,
      }))
      .sort((a, b) => {
        const aVal = a[sortConfig.key as keyof typeof a] as number;
        const bVal = b[sortConfig.key as keyof typeof b] as number;
        return sortConfig.direction === 'asc' ? (aVal < bVal ? -1 : 1) : aVal > bVal ? -1 : 1;
      });
  }, [data, enrichedData, sortConfig]);

  const totals = useMemo(() => {
    const realAsset = summaryTotals.spot1 + summaryTotals.spot2;
    const totalPosition = aggregatedData.reduce((sum, item) => sum + item.marketValue, 0);
    return {
      realAsset,
      totalPosition,
      leverage: realAsset > 0 ? totalPosition / realAsset : 0,
      profitAmount: aggregatedData.reduce((s, i) => s + i.profit, 0),
    };
  }, [summaryTotals, aggregatedData]);

  const chartData = useMemo(() => {
    const sorted = [...aggregatedData].sort((a, b) => b.marketValue - a.marketValue);
    const topX = sorted.slice(0, 10);
    const othersValue = sorted.slice(10).reduce((sum, item) => sum + item.marketValue, 0);
    const res = topX.map((item) => ({ name: item.name, marketValue: item.marketValue }));
    if (othersValue > 0) res.push({ name: 'その他銘柄', marketValue: othersValue });
    return res;
  }, [aggregatedData]);

  const sectorData = useMemo(() => {
    const sectors: Record<string, { total: number; stocks: { name: string; value: number }[] }> = {};
    aggregatedData.forEach((d) => {
      const sector = d.sector || '未分類';
      if (!sectors[sector]) sectors[sector] = { total: 0, stocks: [] };
      sectors[sector].total += d.marketValue;
      sectors[sector].stocks.push({ name: d.name, value: d.marketValue });
    });
    return Object.entries(sectors)
      .map(([name, d]) => ({ name, value: d.total, stocks: d.stocks.sort((a, b) => b.value - a.value) }))
      .sort((a, b) => b.value - a.value);
  }, [aggregatedData]);

  const comparisonHistory = useMemo(() => {
    if (history.length === 0) return [];
    const base = history[0];
    const baseIndex = indexData[base.date] || { n225: 1, topix: 1 };
    return history.map((curr, histIdx) => {
      const idx = indexData[curr.date] || { n225: 0, topix: 0 };
      const dailyChange = histIdx > 0 ? curr.totalAsset - history[histIdx - 1].totalAsset : 0;
      return {
        ...curr,
        dailyChange,
        dailyChangePercent: histIdx > 0 ? (dailyChange / history[histIdx - 1].totalAsset) * 100 : 0,
        portfolioNorm: (curr.totalAsset / base.totalAsset) * 100,
        n225Norm: idx.n225 ? (idx.n225 / baseIndex.n225) * 100 : null,
        topixNorm: idx.topix ? (idx.topix / baseIndex.topix) * 100 : null,
      };
    });
  }, [history, indexData]);

  const performanceStats = useMemo(() => {
    if (comparisonHistory.length === 0) return null;
    const last = comparisonHistory[comparisonHistory.length - 1];
    return {
      portfolioTotal: last.portfolioNorm - 100,
      vsNikkei: last.n225Norm ? last.portfolioNorm - last.n225Norm : 0,
    };
  }, [comparisonHistory]);

  // Actions
  const handleFetchSectors = async () => {
    if (aggregatedData.length === 0) return;
    setIsAnalyzing(true);
    addLog(`AI: 銘柄 ${aggregatedData.length}件の業種分析を開始...`);
    try {
      const result = await fetchSectorClassification(
        aggregatedData.map((d) => d.code)
      );
      const newEnrichment: Record<string, { sector: string }> = {};
      Object.entries(result).forEach(([code, sector]) => {
        newEnrichment[code] = { sector };
      });
      setEnrichedData((prev) => ({ ...prev, ...newEnrichment }));
      addLog('AI: 業種分析が完了しました。');
    } catch (err: any) {
      addLog(`AI Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFetchIndices = async () => {
    if (history.length === 0) return;
    setIsAnalyzing(true);
    addLog('AI: 市場指数のヒストリカルデータを取得中...');
    try {
      const result = await fetchIndexData(
        history.map((h) => h.date)
      );
      setIndexData(result);
      addLog('AI: 指数データの同期が完了しました。');
    } catch (err: any) {
      addLog(`AI Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (totals.realAsset === 0) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const snapshot: DailySnapshot = {
        date: selectedDate,
        totalAsset: totals.realAsset,
        totalProfit: totals.profitAmount,
        timestamp: Date.now(),
      };
      await saveSnapshot(settings, snapshot);
      // Update local history
      setHistory((prev) => {
        const idx = prev.findIndex((s) => s.date === selectedDate);
        const updated = [...prev];
        if (idx >= 0) updated[idx] = snapshot;
        else updated.push(snapshot);
        return updated.sort((a, b) => a.date.localeCompare(b.date));
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSnapshot = async (date: string) => {
    await deleteSnapshot(settings, date);
    setHistory((prev) => prev.filter((s) => s.date !== date));
  };

  const handleSort = (key: string) =>
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));

  const tabs = [
    { id: 'summary', label: 'サマリー' },
    { id: 'sector', label: '業種別詳細' },
    { id: 'holdings', label: '保有銘柄' },
    { id: 'history', label: '比較・推移' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            資産管理
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">楽天証券CSV：ポートフォリオ分析</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-lg px-2 py-1.5">
            <svg className="w-4 h-4 text-accent-gold mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm text-text-primary focus:outline-none [color-scheme:light]"
            />
          </div>
          <button
            onClick={handleSaveSnapshot}
            disabled={totals.realAsset === 0 || isSaving}
            className="px-3 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 disabled:opacity-40 flex items-center gap-1.5"
          >
            {isSaving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            記録を保存
          </button>
          {saveStatus === 'success' && (
            <span className="text-xs text-up">保存完了</span>
          )}
        </div>
      </div>

      {/* CSV Upload + AI buttons */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8">
          <CsvUploader onFilesSelected={handleBulkUpload} logs={logs} />
        </div>
        <div className="md:col-span-4 flex flex-col gap-2">
          <button
            onClick={handleFetchSectors}
            disabled={aggregatedData.length === 0 || isAnalyzing}
            className="flex-1 flex flex-col items-center justify-center p-4 bg-bg-card shadow-[var(--shadow-card)] border border-border text-text-primary rounded-xl hover:bg-bg-card disabled:opacity-30"
          >
            {isAnalyzing ? (
              <svg className="w-6 h-6 animate-spin text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
            <span className="text-xs mt-2 font-medium">業種分析を実行</span>
            {false && <span className="text-xs text-text-secondary/50 mt-0.5">Gemini APIキー必要</span>}
          </button>
          <button
            onClick={handleFetchIndices}
            disabled={history.length === 0 || isAnalyzing}
            className="flex-1 flex flex-col items-center justify-center p-4 bg-bg-card shadow-[var(--shadow-card)] border border-border text-text-primary rounded-xl hover:bg-bg-card disabled:opacity-30"
          >
            <svg className="w-5 h-5 text-up" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-xs mt-2 font-medium">比較データを同期</span>
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-text-secondary mb-1">総資産 (Equity)</p>
          <h3 className="text-xl font-bold text-text-primary font-mono">¥{totals.realAsset.toLocaleString()}</h3>
        </div>
        <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-text-secondary mb-1">評価損益合計</p>
          <h3 className={`text-xl font-bold font-mono ${totals.profitAmount >= 0 ? 'text-up' : 'text-down'}`}>
            ¥{totals.profitAmount.toLocaleString()}
          </h3>
          <span className={`text-xs font-mono ${totals.profitAmount >= 0 ? 'text-up' : 'text-down'}`}>
            {((totals.profitAmount / (totals.realAsset || 1)) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-text-secondary mb-1">対市場インデックス</p>
          {performanceStats ? (
            <h3 className={`text-xl font-bold font-mono ${performanceStats.vsNikkei >= 0 ? 'text-up' : 'text-down'}`}>
              {performanceStats.vsNikkei >= 0 ? '+' : ''}{performanceStats.vsNikkei.toFixed(2)}%
            </h3>
          ) : (
            <p className="text-text-secondary/50 text-sm italic">同期で表示</p>
          )}
        </div>
        <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-text-secondary mb-1">実質レバレッジ</p>
          <h3 className="text-xl font-bold text-accent-gold font-mono">{totals.leverage.toFixed(2)}<span className="text-sm ml-0.5">倍</span></h3>
          <div className="w-full bg-bg-primary h-1.5 rounded-full mt-2 overflow-hidden">
            <div className={`h-full transition-all ${totals.leverage > 2.5 ? 'bg-down' : 'bg-accent-gold'}`} style={{ width: `${Math.min(totals.leverage * 20, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'text-accent-cyan border-b-2 border-accent-cyan bg-accent-cyan/5' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Summary tab */}
          {activeTab === 'summary' && totals.realAsset > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-text-primary mb-4 w-full">資産構成比 (Top 10 + その他)</h4>
                <div className="h-[350px] w-full relative">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartData} dataKey="marketValue" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} stroke="rgba(0,0,0,0.3)" strokeWidth={2} label={CustomPieLabel} labelLine={false}>
                        {chartData.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xs text-text-secondary">総ポジション</p>
                    <p className="text-sm font-bold text-text-primary font-mono">¥{totals.totalPosition.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text-primary">口座別内訳</h4>
                {[
                  { label: '口座1 (現物)', val: summaryTotals.spot1 },
                  { label: '口座2 (現物)', val: summaryTotals.spot2 },
                  { label: '口座2 (信用建玉)', val: summaryTotals.margin, isMargin: true },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-bg-primary/30 rounded-lg">
                    <span className="text-sm text-text-secondary">{r.label}</span>
                    <span className={`text-sm font-bold font-mono ${r.isMargin ? 'text-accent-gold' : 'text-text-primary'}`}>
                      ¥{r.val.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-primary">総資産 合計</span>
                  <span className="text-lg font-bold font-mono text-accent-cyan">¥{totals.realAsset.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sector tab */}
          {activeTab === 'sector' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-4">業種構成比</h4>
                <div className="h-[350px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {sectorData.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                <h4 className="text-sm font-semibold text-text-primary">業種別構成銘柄</h4>
                {sectorData.map((s, i) => (
                  <div key={i} className="bg-bg-primary/30 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-semibold text-text-primary">{s.name}</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-text-primary">¥{s.value.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                      {s.stocks.map((stock, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-text-secondary px-2">
                          <span>{stock.name}</span>
                          <span className="font-mono">¥{stock.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings tab */}
          {activeTab === 'holdings' && totals.realAsset > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-text-secondary text-xs border-b border-border">
                  <tr>
                    <th className="pb-3 px-3 cursor-pointer hover:text-accent-cyan" onClick={() => handleSort('name')}>銘柄 / コード</th>
                    <th className="pb-3 px-3 text-right cursor-pointer hover:text-accent-cyan" onClick={() => handleSort('price')}>株価</th>
                    <th className="pb-3 px-3 text-right cursor-pointer hover:text-accent-cyan" onClick={() => handleSort('quantity')}>株数</th>
                    <th className="pb-3 px-3 text-right cursor-pointer hover:text-accent-cyan" onClick={() => handleSort('portfolioWeight')}>比率</th>
                    <th className="pb-3 px-3 text-right cursor-pointer hover:text-accent-cyan" onClick={() => handleSort('marketValue')}>評価額</th>
                    <th className="pb-3 px-3 text-right cursor-pointer hover:text-accent-cyan" onClick={() => handleSort('profit')}>評価損益 / 率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {aggregatedData.map((item, i) => (
                    <tr key={i} className="hover:bg-bg-primary/30">
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text-primary">{item.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono bg-bg-primary text-text-secondary px-1 py-0.5 rounded">{item.code}</span>
                            <span className="text-xs bg-accent-cyan/10 text-accent-cyan px-1 py-0.5 rounded">{item.sector || '未分類'}</span>
                            {Array.from(item.types || []).map((t) => (
                              <span key={t} className={`text-xs px-1 py-0.5 rounded ${t === '信用' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-up/10 text-up'}`}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-text-primary">¥{item.price > 0 ? item.price.toLocaleString() : '-'}</td>
                      <td className="py-3 px-3 text-right font-mono text-text-primary">{item.quantity > 0 ? item.quantity.toLocaleString() : '-'}</td>
                      <td className="py-3 px-3 text-right font-mono text-text-primary">{(item.portfolioWeight || 0).toFixed(2)}%</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">¥{item.marketValue.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-bold ${item.profit >= 0 ? 'text-up' : 'text-down'}`}>
                          {item.profit >= 0 ? '+' : ''}{item.profit.toLocaleString()}
                        </span>
                        <div className={`text-xs font-mono ${item.profit >= 0 ? 'text-up' : 'text-down'}`}>
                          ({item.profitRate.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {performanceStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-up/10 border border-up/20 rounded-lg p-3">
                    <p className="text-xs text-text-secondary mb-1">最高資産額</p>
                    <p className="text-lg font-bold text-up font-mono">¥{Math.max(...history.map((h) => h.totalAsset)).toLocaleString()}</p>
                  </div>
                  <div className="bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg p-3">
                    <p className="text-xs text-text-secondary mb-1">通算騰落率</p>
                    <p className={`text-lg font-bold font-mono ${performanceStats.portfolioTotal >= 0 ? 'text-up' : 'text-down'}`}>
                      {performanceStats.portfolioTotal >= 0 ? '+' : ''}{performanceStats.portfolioTotal.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3">
                    <p className="text-xs text-text-secondary mb-1">対日経平均</p>
                    <p className={`text-lg font-bold font-mono ${performanceStats.vsNikkei >= 0 ? 'text-up' : 'text-down'}`}>
                      {performanceStats.vsNikkei >= 0 ? '+' : ''}{performanceStats.vsNikkei.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-bg-primary/30 rounded-lg p-3">
                    <p className="text-xs text-text-secondary mb-1">記録日数</p>
                    <p className="text-lg font-bold text-text-primary font-mono">{history.length} <span className="text-xs">日間</span></p>
                  </div>
                </div>
              )}

              {/* Performance chart */}
              <div className="h-[300px] bg-bg-primary/30 rounded-lg p-3">
                {comparisonHistory.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={comparisonHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                      <Legend verticalAlign="top" height={30} />
                      <Line type="monotone" dataKey="portfolioNorm" name="MY資産" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3, fill: '#22d3ee' }} />
                      {indexData[history[0]?.date] && (
                        <>
                          <Line type="monotone" dataKey="n225Norm" name="日経平均" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="topixNorm" name="TOPIX" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-secondary/50 text-sm italic">
                    履歴がありません。CSVをアップロードして「記録を保存」してください。
                  </div>
                )}
              </div>

              {/* History table */}
              {comparisonHistory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-text-secondary text-xs border-b border-border">
                      <tr>
                        <th className="pb-2 px-3">日付</th>
                        <th className="pb-2 px-3 text-right">総資産</th>
                        <th className="pb-2 px-3 text-right">前日比</th>
                        <th className="pb-2 px-3 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {[...comparisonHistory].reverse().map((h, i) => (
                        <tr key={i} className="hover:bg-bg-primary/30">
                          <td className="py-2.5 px-3 text-text-secondary">{h.date}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-text-primary">¥{h.totalAsset.toLocaleString()}</td>
                          <td className={`py-2.5 px-3 text-right ${h.dailyChange >= 0 ? 'text-up' : 'text-down'}`}>
                            {h.dailyChange >= 0 ? '+' : ''}{h.dailyChange.toLocaleString()}
                            <span className="text-xs ml-1">({h.dailyChangePercent >= 0 ? '+' : ''}{h.dailyChangePercent.toFixed(2)}%)</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button onClick={() => handleDeleteSnapshot(h.date)} className="text-text-secondary/40 hover:text-down">
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
          )}

          {/* Empty state */}
          {activeTab === 'summary' && totals.realAsset === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-text-secondary/50">
              <p className="text-sm">CSVファイルをアップロードしてください</p>
            </div>
          )}
          {activeTab === 'holdings' && totals.realAsset === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-text-secondary/50">
              <p className="text-sm">CSVファイルをアップロードしてください</p>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-3">
          <h4 className="text-xs font-semibold text-text-secondary mb-2">ログ</h4>
          <div className="max-h-32 overflow-y-auto text-xs font-mono text-text-secondary/70 space-y-0.5">
            {logs.map((l, i) => (
              <div key={i} className="border-l-2 border-accent-cyan/20 pl-2">{l}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
