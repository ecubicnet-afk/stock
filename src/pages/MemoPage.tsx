import { useState, useEffect } from 'react';
import { useMemos } from '../hooks/useMemos';
import { useSchedule } from '../hooks/useSchedule';
import { ScheduleCalendar } from '../components/schedule/ScheduleCalendar';
import { ImageAttachment, ImageThumbnails } from '../components/common/ImageAttachment';
import type { ScheduleEvent } from '../types';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

const IMPORTANCE_STYLES: Record<ScheduleEvent['importance'], { dot: string; label: string }> = {
  high: { dot: 'bg-red-500', label: '重要' },
  medium: { dot: 'bg-amber-400', label: '注目' },
  low: { dot: 'bg-cyan-400', label: '参考' },
};

const REGION_FLAG: Record<string, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
};

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newImportance, setNewImportance] = useState<ScheduleEvent['importance']>('medium');
  const [newDescription, setNewDescription] = useState('');
  const [newRegion, setNewRegion] = useState<RegionType>('JP');
  const [newEventImages, setNewEventImages] = useState<string[]>([]);

  // Event editing state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventImportance, setEditEventImportance] = useState<ScheduleEvent['importance']>('medium');
  const [editEventDescription, setEditEventDescription] = useState('');
  const [editEventRegion, setEditEventRegion] = useState<RegionType>('JP');

  // Inline event memo editing
  const [eventMemoEditId, setEventMemoEditId] = useState<string | null>(null);
  const [eventMemoText, setEventMemoText] = useState('');

  // Auto-populate date when selecting a calendar date
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

  const handleStartEdit = (id: string, text: string, images?: string[]) => {
    setEditingId(id);
    setEditText(text);
    setEditImages(images ?? []);
  };

  const handleSaveEdit = () => {
    if (editingId && (editText.trim() || editImages.length > 0)) {
      updateMemo(editingId, editText.trim(), editImages.length > 0 ? editImages : undefined);
    }
    setEditingId(null);
    setEditText('');
    setEditImages([]);
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

  const handleStartEditEvent = (event: ScheduleEvent) => {
    setEditingEventId(event.id);
    setEditEventTitle(event.title);
    setEditEventDate(event.date);
    setEditEventTime(event.time);
    setEditEventImportance(event.importance);
    setEditEventDescription(event.description || '');
    setEditEventRegion(event.region || 'JP');
  };

  const handleSaveEventEdit = () => {
    if (editingEventId && editEventTitle.trim() && editEventDate) {
      updateEvent(editingEventId, {
        title: editEventTitle.trim(),
        date: editEventDate,
        time: editEventTime || '00:00',
        importance: editEventImportance,
        description: editEventDescription.trim() || undefined,
        region: editEventRegion || undefined,
      });
    }
    setEditingEventId(null);
  };

  const handleCancelEventEdit = () => {
    setEditingEventId(null);
  };

  // Inline event memo save
  const handleSaveEventMemo = (eventId: string) => {
    updateEvent(eventId, {
      description: eventMemoText.trim() || undefined,
    });
    setEventMemoEditId(null);
    setEventMemoText('');
  };

  const handleStartEventMemo = (event: ScheduleEvent) => {
    setEventMemoEditId(event.id);
    setEventMemoText(event.description || '');
  };

  // Filter events: selected date or current month
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
      <h1 className="text-lg font-semibold text-text-primary">
        メモ & スケジュール
      </h1>

      {/* Top: Memo + Event Add side by side */}
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

      {/* Calendar - full width */}
      <ScheduleCalendar
        year={calYear}
        month={calMonth}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeMonth={handleChangeMonth}
      />

      {/* Event List - full width */}
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
                  <div key={event.id}>
                    {editingEventId === event.id ? (
                      /* Edit Event Form */
                      <div className="bg-bg-primary/50 border border-accent-gold/30 rounded-lg p-3 space-y-2">
                        <input
                          type="text"
                          value={editEventTitle}
                          onChange={(e) => setEditEventTitle(e.target.value)}
                          className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50"
                          autoFocus
                        />
                        <textarea
                          value={editEventDescription}
                          onChange={(e) => setEditEventDescription(e.target.value)}
                          placeholder="詳細メモ（任意）"
                          className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-gold/50 h-16"
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="date"
                            value={editEventDate}
                            onChange={(e) => setEditEventDate(e.target.value)}
                            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
                          />
                          <input
                            type="time"
                            value={editEventTime}
                            onChange={(e) => setEditEventTime(e.target.value)}
                            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
                          />
                          <select
                            value={editEventImportance}
                            onChange={(e) => setEditEventImportance(e.target.value as ScheduleEvent['importance'])}
                            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
                          >
                            <option value="high">重要</option>
                            <option value="medium">注目</option>
                            <option value="low">参考</option>
                          </select>
                          <select
                            value={editEventRegion || ''}
                            onChange={(e) => setEditEventRegion((e.target.value || undefined) as RegionType)}
                            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
                          >
                            <option value="JP">🇯🇵</option>
                            <option value="US">🇺🇸</option>
                            <option value="other">他</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveEventEdit} className="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-lg hover:bg-accent-gold/30">保存</button>
                          <button onClick={handleCancelEventEdit} className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
                        </div>
                      </div>
                    ) : (
                      /* Event Display with description + memo */
                      <div className="bg-bg-primary/30 border border-border/50 rounded-lg px-3 py-2.5">
                        {/* Header row */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0 w-5 text-center">
                            {event.region && REGION_FLAG[event.region] ? REGION_FLAG[event.region] : ''}
                          </span>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${IMPORTANCE_STYLES[event.importance].dot}`} />
                          <span className="font-mono text-sm text-text-secondary w-14 shrink-0">{event.time}</span>
                          <span className="text-sm text-text-primary flex-1 min-w-0 font-medium truncate">
                            {event.title}
                          </span>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => handleStartEditEvent(event)} className="text-text-secondary/40 hover:text-accent-cyan transition-colors" title="編集">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => deleteEvent(event.id)} className="text-text-secondary/40 hover:text-down transition-colors" title="削除">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Description (always visible if exists) */}
                        {event.description && eventMemoEditId !== event.id && (
                          <div className="mt-1.5 ml-[3.75rem] text-xs text-text-secondary/80 whitespace-pre-wrap border-l-2 border-accent-gold/30 pl-2">
                            {event.description}
                          </div>
                        )}
                        {event.images && event.images.length > 0 && eventMemoEditId !== event.id && (
                          <div className="ml-[3.75rem]">
                            <ImageThumbnails images={event.images} />
                          </div>
                        )}

                        {/* Memo edit area */}
                        {eventMemoEditId === event.id ? (
                          <div className="mt-2 ml-[3.75rem]">
                            <textarea
                              value={eventMemoText}
                              onChange={(e) => setEventMemoText(e.target.value)}
                              className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-xs text-text-primary resize-none focus:outline-none focus:border-accent-gold/50 h-20"
                              placeholder="このイベントについてメモを入力..."
                              autoFocus
                            />
                            <div className="flex gap-2 mt-1.5">
                              <button
                                onClick={() => handleSaveEventMemo(event.id)}
                                className="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-lg hover:bg-accent-gold/30"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEventMemoEditId(null)}
                                className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEventMemo(event)}
                            className="mt-1.5 ml-[3.75rem] text-[11px] text-text-secondary/40 hover:text-accent-gold/70 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {event.description ? 'メモを編集' : 'メモを追加'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memo List */}
      {memos.length > 0 && (
        <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-accent-cyan mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            保存済みメモ
          </h2>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {memos.map((memo) => (
              <div key={memo.id} className="bg-bg-primary/30 border border-border/50 rounded-lg p-3">
                {editingId === memo.id ? (
                  <>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-20 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50"
                      autoFocus
                    />
                    <div className="mt-2">
                      <ImageAttachment images={editImages} onChange={setEditImages} maxImages={5} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/30">保存</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{memo.text}</p>
                    <ImageThumbnails images={memo.images} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-secondary/60">{formatDateTime(memo.updatedAt)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleStartEdit(memo.id, memo.text, memo.images)} className="text-xs text-text-secondary hover:text-accent-cyan transition-colors">編集</button>
                        <button onClick={() => deleteMemo(memo.id)} className="text-xs text-text-secondary hover:text-down transition-colors">削除</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
