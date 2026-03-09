import { useState } from 'react';
import { useJournal } from '../hooks/useJournal';
import { useTrades } from '../hooks/useTrades';
import { JournalCalendar } from '../components/journal/JournalCalendar';
import { DailyEntryForm } from '../components/journal/DailyEntryForm';
import { TradeList } from '../components/journal/TradeList';
import { TradeForm } from '../components/journal/TradeForm';
import { JournalStats } from '../components/journal/JournalStats';

export function JournalPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [showTradeForm, setShowTradeForm] = useState(false);

  const { entries, getEntryByDate, saveEntry } = useJournal();
  const { trades, addTrade, deleteTrade, getTradesByDate, stats } = useTrades();

  const currentEntry = getEntryByDate(selectedDate);
  const dayTrades = getTradesByDate(selectedDate);

  const handleChangeMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">トレード日誌</h1>

      <JournalStats {...stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div>
          <JournalCalendar
            year={calYear}
            month={calMonth}
            entries={entries}
            trades={trades}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onChangeMonth={handleChangeMonth}
          />
        </div>

        {/* Daily Panel */}
        <div className="lg:col-span-2 space-y-3">
          <DailyEntryForm
            date={selectedDate}
            entry={currentEntry}
            onSave={saveEntry}
          />

          {/* Trade section */}
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
                  onClick={() => setShowTradeForm(true)}
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
                  onAdd={(trade) => {
                    addTrade(trade);
                    setShowTradeForm(false);
                  }}
                  onCancel={() => setShowTradeForm(false)}
                />
              </div>
            )}

            <TradeList trades={dayTrades} onDelete={deleteTrade} />
          </div>
        </div>
      </div>
    </div>
  );
}
