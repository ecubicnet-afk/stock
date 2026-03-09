import type { JournalEntry, TradeRecord } from '../../types';

interface Props {
  year: number;
  month: number;
  entries: JournalEntry[];
  trades: TradeRecord[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export function JournalCalendar({ year, month, entries, trades, selectedDate, onSelectDate, onChangeMonth }: Props) {
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
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onChangeMonth(-1)} className="text-text-secondary hover:text-text-primary px-2 py-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-semibold text-text-primary">{monthLabel}</span>
        <button onClick={() => onChangeMonth(1)} className="text-text-secondary hover:text-text-primary px-2 py-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs text-text-secondary/60 py-1">{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const isSelected = cell.dateStr === selectedDate;
          const hasEntry = entryDates.has(cell.dateStr);
          const hasTrade = tradeDates.has(cell.dateStr);
          const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`relative text-xs py-1.5 rounded-lg transition-all ${
                isSelected
                  ? 'bg-accent-cyan/20 text-accent-cyan font-bold'
                  : isToday
                    ? 'bg-bg-primary text-text-primary font-semibold'
                    : 'text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary'
              }`}
            >
              {cell.day}
              {(hasEntry || hasTrade) && (
                <div className="flex gap-0.5 justify-center absolute bottom-0.5 left-0 right-0">
                  {hasEntry && <span className="w-1 h-1 rounded-full bg-accent-cyan" />}
                  {hasTrade && <span className="w-1 h-1 rounded-full bg-accent-gold" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
