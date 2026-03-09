import { useState, useRef, useMemo } from 'react';
import { useJournal } from '../hooks/useJournal';
import { useTrades } from '../hooks/useTrades';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { JournalCalendar } from '../components/journal/JournalCalendar';
import { DailyEntryForm } from '../components/journal/DailyEntryForm';
import { TradeList } from '../components/journal/TradeList';
import { TradeForm } from '../components/journal/TradeForm';
import { TradeAnalysisContent } from './TradeAnalysisPage';
import type { SelectedCsvTrade } from './TradeAnalysisPage';
import type { AnalysisTrade } from '../utils/csvParser';

export interface PrefillData {
  date?: string;
  ticker?: string;
  tickerName?: string;
  side?: 'buy' | 'sell';
  pnl?: number;
  quantity?: number;
  price?: number;
}

export function JournalPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [prefill, setPrefill] = useState<PrefillData | undefined>();

  const journalRef = useRef<HTMLDivElement>(null);

  const { entries, getEntryByDate, saveEntry, deleteEntry } = useJournal();
  const { trades, addTrade, deleteTrade, getTradesByDate } = useTrades();

  // Read CSV trade data from localStorage (shared with TradeAnalysisContent)
  const [csvTradeData] = useLocalStorage<AnalysisTrade[]>('stock-app-trade-analysis', []);

  // Build CSV trade dates set and filter for selected date
  const csvTradeDates = useMemo(() => {
    const dates = new Set<string>();
    csvTradeData.forEach((t) => {
      dates.add(t.date.replace(/\//g, '-'));
    });
    return dates;
  }, [csvTradeData]);

  const selectedDayCsvTrades = useMemo(() => {
    return csvTradeData.filter((t) => t.date.replace(/\//g, '-') === selectedDate);
  }, [csvTradeData, selectedDate]);

  const dayStats = useMemo(() => {
    if (selectedDayCsvTrades.length === 0) return null;
    const wins = selectedDayCsvTrades.filter((t) => t.profit > 0);
    const losses = selectedDayCsvTrades.filter((t) => t.profit < 0);
    const totalPnl = selectedDayCsvTrades.reduce((s, t) => s + t.profit, 0);
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0)) / losses.length : 0;
    return {
      count: selectedDayCsvTrades.length,
      winRate: (wins.length / selectedDayCsvTrades.length) * 100,
      totalPnl,
      avgPnl: totalPnl / selectedDayCsvTrades.length,
      rrRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
      wins: wins.length,
      losses: losses.length,
    };
  }, [selectedDayCsvTrades]);

  const currentEntry = getEntryByDate(selectedDate);
  const dayTrades = getTradesByDate(selectedDate);

  const handleChangeMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const handleSelectCsvTrade = (trade: SelectedCsvTrade) => {
    const normalizedDate = trade.date.replace(/\//g, '-');
    setSelectedDate(normalizedDate);

    const d = new Date(normalizedDate + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    }

    setPrefill({
      date: normalizedDate,
      ticker: trade.ticker,
      tickerName: trade.name,
      side: 'sell',
      pnl: trade.profit,
      quantity: trade.quantity || undefined,
      price: trade.price || undefined,
    });
    setShowTradeForm(true);

    setTimeout(() => {
      journalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCsvRowClick = (t: AnalysisTrade) => {
    setPrefill({
      date: selectedDate,
      ticker: t.ticker,
      tickerName: t.name,
      side: 'sell',
      pnl: t.profit,
      quantity: t.quantity || undefined,
      price: t.price || undefined,
    });
    setShowTradeForm(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-text-primary">トレード</h1>

      {/* Analysis section */}
      <TradeAnalysisContent onSelectTrade={handleSelectCsvTrade} />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Journal section */}
      <div ref={journalRef}>
        <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          トレード日誌
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <JournalCalendar
              year={calYear}
              month={calMonth}
              entries={entries}
              trades={trades}
              csvTradeDates={csvTradeDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onChangeMonth={handleChangeMonth}
            />
          </div>

          <div className="lg:col-span-2 space-y-3">
            <DailyEntryForm
              date={selectedDate}
              entry={currentEntry}
              onSave={saveEntry}
              onDelete={deleteEntry}
            />

            {/* Trade record section (above CSV data) */}
            <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-accent-gold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  トレード記録
                </h3>
                {!showTradeForm && (
                  <button
                    onClick={() => { setPrefill(undefined); setShowTradeForm(true); }}
                    className="text-xs text-accent-gold hover:text-accent-gold/80"
                  >
                    + 新規追加
                  </button>
                )}
              </div>

              {showTradeForm && (
                <div className="mb-3">
                  <TradeForm
                    date={selectedDate}
                    prefill={prefill}
                    onAdd={(trade) => {
                      addTrade(trade);
                      setShowTradeForm(false);
                      setPrefill(undefined);
                    }}
                    onCancel={() => { setShowTradeForm(false); setPrefill(undefined); }}
                  />
                </div>
              )}

              <TradeList trades={dayTrades} onDelete={deleteTrade} />
            </div>

            {/* CSV Trades for selected date with daily stats */}
            {selectedDayCsvTrades.length > 0 && (
              <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-up flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV取引データ
                  </h3>
                  <span className="text-[10px] text-up/60">クリックでトレード記録に入力</span>
                </div>

                {/* Daily stats summary */}
                {dayStats && (
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <div className="bg-bg-primary/40 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[10px] text-text-secondary">取引数</div>
                      <div className="text-sm font-bold font-mono text-text-primary">{dayStats.count}</div>
                      <div className="text-[10px] text-text-secondary">{dayStats.wins}勝{dayStats.losses}負</div>
                    </div>
                    <div className="bg-bg-primary/40 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[10px] text-text-secondary">勝率</div>
                      <div className={`text-sm font-bold font-mono ${dayStats.winRate >= 50 ? 'text-up' : 'text-down'}`}>
                        {dayStats.winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-bg-primary/40 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[10px] text-text-secondary">合計損益</div>
                      <div className={`text-sm font-bold font-mono ${dayStats.totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {dayStats.totalPnl >= 0 ? '+' : ''}{dayStats.totalPnl.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-bg-primary/40 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[10px] text-text-secondary">平均損益</div>
                      <div className={`text-sm font-bold font-mono ${dayStats.avgPnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {dayStats.avgPnl >= 0 ? '+' : ''}{Math.round(dayStats.avgPnl).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-bg-primary/40 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[10px] text-text-secondary">RR比</div>
                      <div className="text-sm font-bold font-mono text-text-primary">
                        {dayStats.rrRatio > 0 ? dayStats.rrRatio.toFixed(2) : '-'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-text-secondary border-b border-border">
                      <tr>
                        <th className="px-2 py-1.5">コード</th>
                        <th className="px-2 py-1.5">銘柄</th>
                        <th className="px-2 py-1.5 text-right">数量</th>
                        <th className="px-2 py-1.5 text-right">単価</th>
                        <th className="px-2 py-1.5 text-right">損益</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedDayCsvTrades.map((t, i) => (
                        <tr
                          key={i}
                          className="cursor-pointer hover:bg-up/5 transition-colors"
                          onClick={() => handleCsvRowClick(t)}
                        >
                          <td className="px-2 py-1.5 font-mono text-text-secondary">{t.ticker || '-'}</td>
                          <td className="px-2 py-1.5 text-text-primary">{t.name}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-text-secondary">{t.quantity > 0 ? t.quantity.toLocaleString() : '-'}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-text-secondary">{t.price > 0 ? t.price.toLocaleString() : '-'}</td>
                          <td className={`px-2 py-1.5 text-right font-mono font-bold ${t.profit > 0 ? 'text-up' : 'text-down'}`}>
                            {t.profit > 0 ? '+' : ''}{t.profit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
