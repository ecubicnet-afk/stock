import { useState, useEffect, useMemo } from 'react';
import { useMemos } from '../hooks/useMemos';
import { useSchedule } from '../hooks/useSchedule';
import { useWatchlist } from '../hooks/useWatchlist';
import { useTrades } from '../hooks/useTrades';
import { ScheduleCalendar } from '../components/schedule/ScheduleCalendar';
import { ImageAttachment } from '../components/common/ImageAttachment';
import { RichTextEditor } from '../components/common/RichTextEditor';
import { RichTextDisplay } from '../components/common/RichTextDisplay';
import { EventCard } from '../components/memo/EventCard';
import { MemoList } from '../components/memo/MemoList';
import type { ScheduleEvent, WatchlistItem } from '../types';

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${dt.getMonth() + 1}/${dt.getDate()} (${days[dt.getDay()]})`;
}

const IMPORTANCE_DOT: Record<ScheduleEvent['importance'], string> = {
  high: 'bg-down',
  medium: 'bg-accent-gold',
  low: 'bg-accent-cyan',
};

type RegionType = ScheduleEvent['region'];

export function MemoPage() {
  const { memos, addMemo, updateMemo, deleteMemo } = useMemos();
  const { events, addEvent, updateEvent, deleteEvent } = useSchedule();
  const {
    items: watchlistItems,
    addItem: addWatchlistItem,
    removeItem: removeWatchlistItem,
    updateNotes: updateWatchlistNotes,
    addEvent: addWatchlistEvent,
    removeEvent: removeWatchlistEvent,
    updateEventById: updateWatchlistEventById,
    removeEventById: removeWatchlistEventById,
  } = useWatchlist();
  const { getTradesByTicker } = useTrades();

  // Merge watchlist events into schedule events for calendar display
  const allEvents = useMemo(() => {
    const watchlistEvents: ScheduleEvent[] = watchlistItems.flatMap((item) =>
      item.events.map((e) => ({
        ...e,
        title: `[${item.tickerName}] ${e.title}`,
      }))
    );
    return [...events, ...watchlistEvents].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
  }, [events, watchlistItems]);

  // Set of schedule event IDs for distinguishing update/delete handlers
  const scheduleEventIds = useMemo(() => new Set(events.map((e) => e.id)), [events]);

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

  // Watchlist state
  const [wlExpandedId, setWlExpandedId] = useState<string | null>(null);
  const [wlShowAddForm, setWlShowAddForm] = useState(false);
  const [wlNewTicker, setWlNewTicker] = useState('');
  const [wlNewName, setWlNewName] = useState('');
  const [wlNewMarket, setWlNewMarket] = useState<WatchlistItem['market']>('JP');
  const [wlEditingNotesId, setWlEditingNotesId] = useState<string | null>(null);
  const [wlNotesDraft, setWlNotesDraft] = useState('');
  const [wlEventTitle, setWlEventTitle] = useState('');
  const [wlEventDate, setWlEventDate] = useState('');
  const [wlEventTime, setWlEventTime] = useState('');
  const [wlEventImportance, setWlEventImportance] = useState<ScheduleEvent['importance']>('medium');
  const [wlEventDescription, setWlEventDescription] = useState('');

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

  // Event update/delete handler that routes to the right hook
  const handleEventUpdate = (id: string, data: Partial<Omit<ScheduleEvent, 'id'>>) => {
    if (scheduleEventIds.has(id)) {
      updateEvent(id, data);
    } else {
      updateWatchlistEventById(id, data);
    }
  };

  const handleEventDelete = (id: string) => {
    if (scheduleEventIds.has(id)) {
      deleteEvent(id);
    } else {
      removeWatchlistEventById(id);
    }
  };

  const filteredEvents = selectedDate
    ? allEvents.filter((e) => e.date === selectedDate)
    : allEvents.filter((e) => {
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

  // Watchlist handlers
  const handleWlAdd = () => {
    if (!wlNewTicker.trim()) return;
    addWatchlistItem({ ticker: wlNewTicker.trim(), tickerName: wlNewName.trim() || wlNewTicker.trim(), market: wlNewMarket });
    setWlNewTicker('');
    setWlNewName('');
    setWlShowAddForm(false);
  };

  const handleWlAddEvent = (itemId: string) => {
    if (!wlEventTitle.trim() || !wlEventDate) return;
    addWatchlistEvent(itemId, {
      title: wlEventTitle.trim(),
      date: wlEventDate,
      time: wlEventTime || '00:00',
      importance: wlEventImportance,
      description: wlEventDescription.trim() || undefined,
    });
    setWlEventTitle('');
    setWlEventDate('');
    setWlEventTime('');
    setWlEventImportance('medium');
    setWlEventDescription('');
  };

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
          <RichTextEditor
            value={newMemoText}
            onChange={setNewMemoText}
            placeholder="投資に関するメモを入力..."
            minHeight="80px"
            accentColor="cyan"
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
            <div className="col-span-2">
              <RichTextEditor
                value={newDescription}
                onChange={setNewDescription}
                placeholder="詳細メモ（任意）"
                minHeight="48px"
                accentColor="gold"
              />
            </div>
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
        events={allEvents}
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
                  <EventCard
                    key={event.id}
                    event={event}
                    onUpdate={handleEventUpdate}
                    onDelete={handleEventDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MemoList memos={memos} onUpdate={updateMemo} onDelete={deleteMemo} />

      {/* ── Watchlist Section ── */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            ウォッチリスト
          </h2>
          <button
            onClick={() => setWlShowAddForm(!wlShowAddForm)}
            className="px-3 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30"
          >
            + 銘柄追加
          </button>
        </div>

        {wlShowAddForm && (
          <div className="bg-bg-card/70 border border-border rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <input type="text" value={wlNewTicker} onChange={(e) => setWlNewTicker(e.target.value)} placeholder="銘柄コード (例: 7203)" className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan/50" />
              <input type="text" value={wlNewName} onChange={(e) => setWlNewName(e.target.value)} placeholder="銘柄名 (例: トヨタ)" className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan/50" />
              <select value={wlNewMarket} onChange={(e) => setWlNewMarket(e.target.value as WatchlistItem['market'])} className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary [color-scheme:dark]">
                <option value="JP">日本株</option>
                <option value="US">米国株</option>
                <option value="other">その他</option>
              </select>
              <button onClick={handleWlAdd} disabled={!wlNewTicker.trim()} className="px-4 py-2 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 disabled:opacity-40">追加</button>
            </div>
          </div>
        )}

        {watchlistItems.length === 0 && !wlShowAddForm && (
          <div className="text-center py-8">
            <p className="text-text-secondary/60 text-sm">ウォッチリストに銘柄を追加してください</p>
          </div>
        )}

        <div className="space-y-2">
          {watchlistItems.map((item) => {
            const isExpanded = wlExpandedId === item.id;
            const tickerTrades = getTradesByTicker(item.ticker);
            return (
              <div key={item.id} className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-primary/30"
                  onClick={() => setWlExpandedId(isExpanded ? null : item.id)}
                >
                  <span className="text-xs px-1.5 py-0.5 rounded bg-bg-primary text-text-secondary">{item.market}</span>
                  <span className="font-mono text-sm font-semibold text-text-primary">{item.ticker}</span>
                  <span className="text-sm text-text-secondary">{item.tickerName}</span>
                  {item.tags.length > 0 && (
                    <div className="flex gap-1 ml-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-accent-cyan/10 text-accent-cyan px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-text-secondary/60">
                      {item.events.length > 0 && `${item.events.length}件の予定`}
                      {item.events.length > 0 && tickerTrades.length > 0 && ' / '}
                      {tickerTrades.length > 0 && `${tickerTrades.length}件のトレード`}
                    </span>
                    <svg className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Notes */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-1">メモ</h4>
                        {wlEditingNotesId === item.id ? (
                          <div>
                            <RichTextEditor
                              value={wlNotesDraft}
                              onChange={setWlNotesDraft}
                              placeholder="メモを入力..."
                              minHeight="80px"
                              accentColor="cyan"
                            />
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => { updateWatchlistNotes(item.id, wlNotesDraft); setWlEditingNotesId(null); }} className="text-xs text-accent-cyan">保存</button>
                              <button onClick={() => setWlEditingNotesId(null)} className="text-xs text-text-secondary">キャンセル</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => { setWlEditingNotesId(item.id); setWlNotesDraft(item.notes); }}
                            className="min-h-[3rem] bg-bg-primary/30 rounded-lg p-2 text-sm text-text-primary cursor-text"
                          >
                            {item.notes ? <RichTextDisplay html={item.notes} className="text-sm text-text-primary" /> : <span className="text-text-secondary/50">クリックしてメモを追加...</span>}
                          </div>
                        )}
                      </div>

                      {/* Events */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-1">予定</h4>
                        <div className="space-y-1 mb-2">
                          {item.events.length === 0 && <p className="text-xs text-text-secondary/50">予定なし</p>}
                          {[...item.events].sort((a, b) => a.date.localeCompare(b.date)).map((ev) => (
                            <div key={ev.id} className="flex items-center gap-2 text-xs">
                              <span className={`w-1.5 h-1.5 rounded-full ${IMPORTANCE_DOT[ev.importance]}`} />
                              <span className="text-text-secondary font-mono">{formatDate(ev.date)}</span>
                              <span className="text-text-primary flex-1 min-w-0 truncate">{ev.title}</span>
                              {ev.description && (
                                <span className="text-text-secondary/50 truncate max-w-[8rem]" title={ev.description}>{ev.description}</span>
                              )}
                              <button onClick={() => removeWatchlistEvent(item.id, ev.id)} className="text-text-secondary/40 hover:text-down shrink-0">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            <input type="text" value={wlEventTitle} onChange={(e) => setWlEventTitle(e.target.value)} placeholder="予定名" className="flex-1 bg-bg-primary/50 border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none" />
                            <input type="date" value={wlEventDate} onChange={(e) => setWlEventDate(e.target.value)} className="bg-bg-primary/50 border border-border rounded px-2 py-1 text-xs text-text-primary [color-scheme:dark]" />
                          </div>
                          <div className="flex gap-1">
                            <input type="time" value={wlEventTime} onChange={(e) => setWlEventTime(e.target.value)} placeholder="時刻" className="bg-bg-primary/50 border border-border rounded px-2 py-1 text-xs text-text-primary [color-scheme:dark]" />
                            <select value={wlEventImportance} onChange={(e) => setWlEventImportance(e.target.value as ScheduleEvent['importance'])} className="bg-bg-primary/50 border border-border rounded px-1 py-1 text-xs text-text-primary [color-scheme:dark]">
                              <option value="high">高</option>
                              <option value="medium">中</option>
                              <option value="low">低</option>
                            </select>
                            <button onClick={() => handleWlAddEvent(item.id)} className="text-xs text-accent-gold hover:text-accent-gold/80 px-2 shrink-0">追加</button>
                          </div>
                          <input type="text" value={wlEventDescription} onChange={(e) => setWlEventDescription(e.target.value)} placeholder="詳細メモ（任意）" className="w-full bg-bg-primary/50 border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Trade history */}
                    {tickerTrades.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-1">トレード履歴</h4>
                        <div className="space-y-1">
                          {tickerTrades.slice(0, 10).map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-xs bg-bg-primary/30 rounded px-2 py-1.5">
                              <span className="font-mono text-text-secondary">{t.date}</span>
                              <span className={`font-bold ${t.side === 'buy' ? 'text-up' : 'text-down'}`}>{t.side === 'buy' ? '買' : '売'}</span>
                              <span className="text-text-primary font-mono">{t.quantity.toLocaleString()}</span>
                              <span className="text-text-secondary">@</span>
                              <span className="text-text-primary font-mono">{t.price.toLocaleString()}</span>
                              {t.pnl !== undefined && (
                                <span className={`ml-auto font-mono ${t.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                                  {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button onClick={() => removeWatchlistItem(item.id)} className="text-xs text-down/60 hover:text-down">この銘柄を削除</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
