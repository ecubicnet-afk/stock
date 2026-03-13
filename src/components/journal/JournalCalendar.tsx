'use client';
import type { JournalEntry, TradeRecord } from '../../types';

interface Props {
  year: number;
  month: number;
  entries: JournalEntry[];
  trades: TradeRecord[];
  csvTradeDates?: Set<string>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export function JournalCalendar({ year, month, entries, trades, csvTradeDates, selectedDate, onSelectDate, onChangeMonth }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();

  const entryDates = new Set(entries.map((e) => e.date));
  const tradeDates = new Set(trades.map((t) => t.date));

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  const monthLabel = `${year}年${month + 1}月`;

  return (
    <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onChangeMonth(-1)} className="text-text-secondary hover:text-text-primary px-3 py-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-base font-bold text-text-primary">{monthLabel}</span>
        <button onClick={() => onChangeMonth(1)} className="text-text-secondary hover:text-text-primary px-3 py-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-xs font-bold py-2 ${i === 5 ? 'text-accent-cyan/70' : i === 6 ? 'text-down/70' : 'text-text-secondary/60'}`}>{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const isSelected = cell.dateStr === selectedDate;
          const hasEntry = entryDates.has(cell.dateStr);
          const hasTrade = tradeDates.has(cell.dateStr);
          const hasCsvTrade = csvTradeDates?.has(cell.dateStr) ?? false;
          const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
          const dow = (startDow + cell.day - 1) % 7;
          const isSat = dow === 5;
          const isSun = dow === 6;

          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`relative text-sm py-3 rounded-lg transition-all font-mono ${
                isSelected
                  ? 'bg-accent-cyan/20 text-accent-cyan font-bold ring-2 ring-accent-cyan/50'
                  : isToday
                    ? 'bg-bg-primary text-text-primary font-bold ring-1 ring-text-secondary/30'
                  : hasCsvTrade
                    ? 'bg-up/5 text-text-primary hover:bg-up/10'
                    : isSat
                      ? 'text-accent-cyan/70 hover:bg-bg-primary/50'
                      : isSun
                        ? 'text-down/70 hover:bg-bg-primary/50'
                        : 'text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary'
              }`}
            >
              {cell.day}
              {(hasEntry || hasTrade || hasCsvTrade) && (
                <div className="flex gap-0.5 justify-center absolute bottom-0.5 left-0 right-0">
                  {hasEntry && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />}
                  {hasTrade && <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />}
                  {hasCsvTrade && !hasTrade && <span className="w-1.5 h-1.5 rounded-full bg-up" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-2 border-t border-border/50 justify-end">
        <div className="flex items-center gap-1 text-[11px] text-text-secondary/60">
          <span className="w-2 h-2 rounded-full bg-accent-cyan" />日誌
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-secondary/60">
          <span className="w-2 h-2 rounded-full bg-accent-gold" />記録
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-secondary/60">
          <span className="w-2 h-2 rounded-full bg-up" />CSV
        </div>
      </div>
    </div>
  );
}
