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

const IMPORTANCE_BORDER: Record<ScheduleEvent['importance'], string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-400',
  low: 'border-l-cyan-400',
};

const REGION_FLAG: Record<string, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
};

const MAX_VISIBLE_EVENTS = 3;

export function ScheduleCalendar({ year, month, events, selectedDate, onSelectDate, onChangeMonth }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();

  // Build a map of date -> events sorted by time
  const eventsByDate = new Map<string, ScheduleEvent[]>();
  for (const e of events) {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!e.date.startsWith(monthPrefix)) continue;
    if (!eventsByDate.has(e.date)) eventsByDate.set(e.date, []);
    eventsByDate.get(e.date)!.push(e);
  }
  for (const [, evts] of eventsByDate) {
    evts.sort((a, b) => a.time.localeCompare(b.time));
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
      {/* Header: Month nav + Legend */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onChangeMonth(-1)} className="text-text-secondary hover:text-text-primary px-2 py-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-base font-semibold text-text-primary">{monthLabel}</span>
        <button onClick={() => onChangeMonth(1)} className="text-text-secondary hover:text-text-primary px-2 py-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 px-1 text-xs text-text-secondary/80">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />重要（高）</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />注目（中）</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />参考（低）</span>
        <span className="border-l border-border/50 pl-3 flex items-center gap-1">🇯🇵 日本</span>
        <span className="flex items-center gap-1">🇺🇸 米国</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-sm text-center py-1 font-medium ${
              i === 5 ? 'text-blue-400/80' : i === 6 ? 'text-red-400/80' : 'text-text-secondary/70'
            }`}
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="min-h-[5.5rem]" />;
          const isSelected = cell.dateStr === selectedDate;
          const isToday = cell.dateStr === todayStr;
          const dayEvents = eventsByDate.get(cell.dateStr) || [];
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;
          const dow = i % 7; // 0=Mon..6=Sun

          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`relative text-left rounded-lg p-1.5 min-h-[5.5rem] transition-all border ${
                isSelected
                  ? 'bg-accent-gold/10 border-accent-gold/40'
                  : isToday
                    ? 'bg-bg-primary/80 border-accent-cyan/30'
                    : 'border-transparent hover:bg-bg-primary/30 hover:border-border/30'
              }`}
            >
              {/* Day number */}
              <div className={`text-sm font-mono mb-0.5 ${
                isSelected
                  ? 'text-accent-gold font-bold'
                  : isToday
                    ? 'text-accent-cyan font-bold'
                    : dow === 5
                      ? 'text-blue-400/80'
                      : dow === 6
                        ? 'text-red-400/80'
                        : 'text-text-secondary'
              }`}>
                {cell.day}
              </div>

              {/* Event list inside cell */}
              <div className="space-y-0.5">
                {visibleEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`text-[11px] leading-tight truncate rounded-sm pl-1 border-l-2 ${IMPORTANCE_BORDER[evt.importance]} ${
                      evt.importance === 'high' ? 'bg-red-500/10' : evt.importance === 'medium' ? 'bg-amber-400/10' : 'bg-cyan-400/10'
                    }`}
                    title={`${evt.time} ${evt.title}${evt.region ? ` (${evt.region})` : ''}`}
                  >
                    <span className="text-[10px]">{evt.region ? REGION_FLAG[evt.region] : ''}</span>
                    <span className="font-mono text-text-secondary/80">{evt.time.slice(0, 5)}</span>
                    {' '}
                    <span className="text-text-primary/90">{evt.title.length > 10 ? evt.title.slice(0, 10) + '…' : evt.title}</span>
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="text-[11px] text-text-secondary/60 pl-1">+{overflow}件</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
