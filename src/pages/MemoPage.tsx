import { useState } from 'react';
import { useMemos } from '../hooks/useMemos';
import { useSchedule } from '../hooks/useSchedule';
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

const IMPORTANCE_STYLES: Record<ScheduleEvent['importance'], string> = {
  high: 'bg-down',
  medium: 'bg-accent-gold',
  low: 'bg-accent-cyan',
};

export function MemoPage() {
  const { memos, addMemo, updateMemo, deleteMemo } = useMemos();
  const { events, addEvent, deleteEvent } = useSchedule();

  const [newMemoText, setNewMemoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newImportance, setNewImportance] = useState<ScheduleEvent['importance']>('medium');

  const handleAddMemo = () => {
    if (!newMemoText.trim()) return;
    addMemo(newMemoText.trim());
    setNewMemoText('');
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      updateMemo(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !newDate) return;
    addEvent({
      title: newTitle.trim(),
      date: newDate,
      time: newTime || '00:00',
      importance: newImportance,
    });
    setNewTitle('');
    setNewDate('');
    setNewTime('');
    setNewImportance('medium');
  };

  const grouped = events.reduce<Record<string, ScheduleEvent[]>>((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">
        メモ & スケジュール
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Memo Section */}
        <div className="space-y-3">
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
              className="w-full h-24 bg-bg-primary/50 border border-border rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-secondary/50"
              placeholder="投資に関するメモを入力...&#10;例: 決算情報、市場分析、銘柄メモなど"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddMemo();
              }}
            />
            <button
              onClick={handleAddMemo}
              disabled={!newMemoText.trim()}
              className="mt-2 px-4 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              保存 (Ctrl+Enter)
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {memos.length === 0 && (
              <p className="text-text-secondary/60 text-sm text-center py-8">メモはまだありません</p>
            )}
            {memos.map((memo) => (
              <div key={memo.id} className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-3">
                {editingId === memo.id ? (
                  <>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-20 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/30">保存</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{memo.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-secondary/60">{formatDateTime(memo.updatedAt)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleStartEdit(memo.id, memo.text)} className="text-xs text-text-secondary hover:text-accent-cyan transition-colors">編集</button>
                        <button onClick={() => deleteMemo(memo.id)} className="text-xs text-text-secondary hover:text-down transition-colors">削除</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="space-y-3">
          <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-accent-gold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              スケジュール
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
                <option value="high">高（重要）</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              <button
                onClick={handleAddEvent}
                disabled={!newTitle.trim() || !newDate}
                className="px-4 py-2 bg-accent-gold/20 text-accent-gold text-sm rounded-lg hover:bg-accent-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {sortedDates.length === 0 && (
              <p className="text-text-secondary/60 text-sm text-center py-8">予定はまだありません</p>
            )}
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="text-xs font-semibold text-text-secondary mb-1.5 px-1">
                  {formatDateLabel(date)}
                </div>
                <div className="space-y-1.5">
                  {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map((event) => (
                    <div key={event.id} className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${IMPORTANCE_STYLES[event.importance]}`} />
                      <span className="font-mono text-xs text-text-secondary w-12 shrink-0">{event.time}</span>
                      <span className="text-sm text-text-primary flex-1">{event.title}</span>
                      <button onClick={() => deleteEvent(event.id)} className="text-text-secondary/40 hover:text-down transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
