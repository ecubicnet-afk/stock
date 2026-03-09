import { useState } from 'react';
import { ImageThumbnails } from '../common/ImageAttachment';
import { LinkifiedText } from '../common/LinkifiedText';
import type { ScheduleEvent } from '../../types';

const IMPORTANCE_STYLES: Record<ScheduleEvent['importance'], { dot: string }> = {
  high: { dot: 'bg-red-500' },
  medium: { dot: 'bg-amber-400' },
  low: { dot: 'bg-cyan-400' },
};

const REGION_FLAG: Record<string, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
};

type RegionType = ScheduleEvent['region'];

interface Props {
  event: ScheduleEvent;
  onUpdate: (id: string, data: Partial<Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function EventCard({ event, onUpdate, onDelete, readOnly }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editImportance, setEditImportance] = useState<ScheduleEvent['importance']>('medium');
  const [editDescription, setEditDescription] = useState('');
  const [editRegion, setEditRegion] = useState<RegionType>('JP');

  const [memoEditing, setMemoEditing] = useState(false);
  const [memoText, setMemoText] = useState('');

  const startEdit = () => {
    setEditing(true);
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditTime(event.time);
    setEditImportance(event.importance);
    setEditDescription(event.description || '');
    setEditRegion(event.region || 'JP');
  };

  const saveEdit = () => {
    if (editTitle.trim() && editDate) {
      onUpdate(event.id, {
        title: editTitle.trim(),
        date: editDate,
        time: editTime || '00:00',
        importance: editImportance,
        description: editDescription.trim() || undefined,
        region: editRegion || undefined,
      });
    }
    setEditing(false);
  };

  const startMemoEdit = () => {
    setMemoEditing(true);
    setMemoText(event.description || '');
  };

  const saveMemo = () => {
    onUpdate(event.id, { description: memoText.trim() || undefined });
    setMemoEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-bg-primary/50 border border-accent-gold/30 rounded-lg p-3 space-y-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50"
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="詳細メモ（任意）"
          className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-gold/50 h-16"
        />
        <div className="grid grid-cols-4 gap-2">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
          />
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
          />
          <select
            value={editImportance}
            onChange={(e) => setEditImportance(e.target.value as ScheduleEvent['importance'])}
            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
          >
            <option value="high">重要</option>
            <option value="medium">注目</option>
            <option value="low">参考</option>
          </select>
          <select
            value={editRegion || ''}
            onChange={(e) => setEditRegion((e.target.value || undefined) as RegionType)}
            className="bg-bg-primary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
          >
            <option value="JP">🇯🇵</option>
            <option value="US">🇺🇸</option>
            <option value="other">他</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={saveEdit} className="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-lg hover:bg-accent-gold/30">保存</button>
          <button onClick={() => setEditing(false)} className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary/30 border border-border/50 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm shrink-0 w-5 text-center">
          {event.region && REGION_FLAG[event.region] ? REGION_FLAG[event.region] : ''}
        </span>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${IMPORTANCE_STYLES[event.importance].dot}`} />
        <span className="font-mono text-sm text-text-secondary w-14 shrink-0">{event.time}</span>
        <span className="text-sm text-text-primary flex-1 min-w-0 font-medium truncate">
          {event.title}
        </span>
        {!readOnly && (
          <div className="flex gap-1.5 shrink-0">
            <button onClick={startEdit} className="text-text-secondary/40 hover:text-accent-cyan transition-colors" title="編集">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(event.id)} className="text-text-secondary/40 hover:text-down transition-colors" title="削除">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {event.description && !memoEditing && (
        <div className="mt-1.5 ml-[3.75rem] text-xs text-text-secondary/80 whitespace-pre-wrap border-l-2 border-accent-gold/30 pl-2">
          <LinkifiedText text={event.description} />
        </div>
      )}
      {event.images && event.images.length > 0 && !memoEditing && (
        <div className="ml-[3.75rem]">
          <ImageThumbnails images={event.images} />
        </div>
      )}

      {memoEditing ? (
        <div className="mt-2 ml-[3.75rem]">
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-xs text-text-primary resize-none focus:outline-none focus:border-accent-gold/50 h-20"
            placeholder="このイベントについてメモを入力..."
            autoFocus
          />
          <div className="flex gap-2 mt-1.5">
            <button onClick={saveMemo} className="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-lg hover:bg-accent-gold/30">保存</button>
            <button onClick={() => setMemoEditing(false)} className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
          </div>
        </div>
      ) : !readOnly ? (
        <button
          onClick={startMemoEdit}
          className="mt-1.5 ml-[3.75rem] text-[11px] text-text-secondary/40 hover:text-accent-gold/70 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {event.description ? 'メモを編集' : 'メモを追加'}
        </button>
      ) : null}
    </div>
  );
}
