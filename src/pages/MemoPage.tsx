import { useState, useEffect } from 'react';
import { useMemos } from '../hooks/useMemos';
import { useSchedule } from '../hooks/useSchedule';
import { ScheduleCalendar } from '../components/schedule/ScheduleCalendar';
import { ImageAttachment } from '../components/common/ImageAttachment';
import { EventCard } from '../components/memo/EventCard';
import { MemoList } from '../components/memo/MemoList';
import type { ScheduleEvent } from '../types';

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

type RegionType = ScheduleEvent['region'];

export function MemoPage() {
  const { memos, addMemo, updateMemo, deleteMemo } = useMemos();
  const { events, addEvent, updateEvent, deleteEvent } = useSchedule();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  const [newMemoText, setNewMemoText] = useState('');
  const [newMemoImages, setNewMemoImages] = useState<string[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newImportance, setNewImportance] = useState<ScheduleEvent['importance']>('medium');
  const [newDescription, setNewDescription] = useState('');
  const [newRegion, setNewRegion] = useState<RegionType>('JP');
  const [newEventImages, setNewEventImages] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDate) setNewDate(selectedDate);
  }, [selectedDate]);

  const handleChangeMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSelectedDate(null);
  };

  const handleAddMemo = () => {
    if (!newMemoText.trim() && newMemoImages.length === 0) return;
    addMemo(newMemoText.trim(), newMemoImages.length > 0 ? newMemoImages : undefined);
    setNewMemoText('');
    setNewMemoImages([]);
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !newDate) return;
    addEvent({
      title: newTitle.trim(),
      date: newDate,
      time: newTime || '00:00',
      importance: newImportance,
      description: newDescription.trim() || undefined,
      region: newRegion || undefined,
      images: newEventImages.length > 0 ? newEventImages : undefined,
    });
    setNewTitle('');
    setNewDate('');
    setNewTime('');
    setNewImportance('medium');
    setNewDescription('');
    setNewRegion('JP');
    setNewEventImages([]);
  };

  const filteredEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : events.filter((e) => {
        const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
        return e.date.startsWith(monthPrefix);
      });

  const grouped = filteredEvents.reduce<Record<string, ScheduleEvent[]>>((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  const eventListHeader = selectedDate
    ? `${formatDateLabel(selectedDate)} のイベント`
    : `${calYear}年${calMonth + 1}月 のイベント`;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">メモ & スケジュール</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Memo Input */}
        <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-accent-cyan mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            投資メモ
          </h2>
          <textarea
            value={newMemoText}
            onChange={(e) => setNewMemoText(e.target.value)}
            className="w-full h-20 bg-bg-primary/50 border border-border rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-secondary/50"
            placeholder="投資に関するメモを入力...&#10;例: 決算情報、市場分析、銘柄メモなど"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddMemo();
            }}
          />
          <ImageAttachment images={newMemoImages} onChange={setNewMemoImages} maxImages={5} />
          <button
            onClick={handleAddMemo}
            disabled={!newMemoText.trim() && newMemoImages.length === 0}
            className="mt-2 px-4 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保存 (Ctrl+Enter)
          </button>
        </div>

        {/* Add Event Form */}
        <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-accent-gold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            イベント追加
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="イベント名"
              className="col-span-2 bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 placeholder:text-text-secondary/50"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
            />
            <select
              value={newImportance}
              onChange={(e) => setNewImportance(e.target.value as ScheduleEvent['importance'])}
              className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
            >
              <option value="high">重要（高）</option>
              <option value="medium">注目（中）</option>
              <option value="low">参考（低）</option>
            </select>
            <select
              value={newRegion || ''}
              onChange={(e) => setNewRegion((e.target.value || undefined) as RegionType)}
              className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
            >
              <option value="JP">🇯🇵 日本</option>
              <option value="US">🇺🇸 米国</option>
              <option value="other">その他</option>
            </select>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="詳細メモ（任意）"
              className="col-span-2 bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-gold/50 placeholder:text-text-secondary/50 h-12"
            />
            <div className="col-span-2">
              <ImageAttachment images={newEventImages} onChange={setNewEventImages} maxImages={3} />
            </div>
            <button
              onClick={handleAddEvent}
              disabled={!newTitle.trim() || !newDate}
              className="col-span-2 px-4 py-2 bg-accent-gold/20 text-accent-gold text-sm rounded-lg hover:bg-accent-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </div>
      </div>

      <ScheduleCalendar
        year={calYear}
        month={calMonth}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeMonth={handleChangeMonth}
      />

      {/* Event List */}
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-accent-gold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {eventListHeader}
          </h2>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-text-secondary hover:text-accent-gold transition-colors"
            >
              月全体を表示
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {sortedDates.length === 0 && (
            <p className="text-text-secondary/60 text-sm text-center py-4">
              {selectedDate ? 'この日のイベントはありません' : 'この月のイベントはありません'}
            </p>
          )}
          {sortedDates.map((date) => (
            <div key={date}>
              {!selectedDate && (
                <div className="text-xs font-semibold text-text-secondary mb-1.5 px-1">
                  {formatDateLabel(date)}
                </div>
              )}
              <div className="space-y-2">
                {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map((event) => (
                  <EventCard key={event.id} event={event} onUpdate={updateEvent} onDelete={deleteEvent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MemoList memos={memos} onUpdate={updateMemo} onDelete={deleteMemo} />
    </div>
  );
}
