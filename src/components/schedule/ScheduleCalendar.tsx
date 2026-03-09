import type { ScheduleEvent } from '../../types';

interface Props {
  year: number;
  month: number;
  events: ScheduleEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export function ScheduleCalendar({ year, month, events, selectedDate, onSelectDate, onChangeMonth }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();

  // Build a map of date -> importance levels present
  const eventsByDate = new Map<string, Set<ScheduleEvent['importance']>>();
  for (const e of events) {
    if (!eventsByDate.has(e.date)) eventsByDate.set(e.date, new Set());
    eventsByDate.get(e.date)!.add(e.importance);
  }

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  const monthLabel = `${year}年${month + 1}月`;
  const todayStr = new Date().toISOString().split('T')[0];

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
          const isToday = cell.dateStr === todayStr;
          const importances = eventsByDate.get(cell.dateStr);
          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`relative text-xs py-2 rounded-lg transition-all ${
                isSelected
                  ? 'bg-accent-gold/20 text-accent-gold font-bold'
                  : isToday
                    ? 'bg-bg-primary text-text-primary font-semibold'
                    : 'text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary'
              }`}
            >
              {cell.day}
              {importances && importances.size > 0 && (
                <div className="flex gap-0.5 justify-center absolute bottom-0.5 left-0 right-0">
                  {importances.has('high') && <span className="w-1.5 h-1.5 rounded-full bg-down" />}
                  {importances.has('medium') && <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />}
                  {importances.has('low') && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
