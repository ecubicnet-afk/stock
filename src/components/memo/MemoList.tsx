'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageAttachment } from '../common/ImageAttachment';
import { RichTextEditor } from '../common/RichTextEditor';
import { RichTextDisplay } from '../common/RichTextDisplay';
import type { MemoEntry } from '../../types';

/* ── パステルカラー付箋テーマ ── */
const STICKY_COLORS = [
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-500', hoverBg: 'hover:bg-amber-100/50' },
  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-500', hoverBg: 'hover:bg-rose-100/50' },
  { bg: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-500', hoverBg: 'hover:bg-sky-100/50' },
  { bg: 'bg-lime-50', border: 'border-lime-200', accent: 'text-lime-500', hoverBg: 'hover:bg-lime-100/50' },
  { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-500', hoverBg: 'hover:bg-violet-100/50' },
  { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-500', hoverBg: 'hover:bg-orange-100/50' },
];

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-[1.5deg]', 'rotate-[0.5deg]', 'rotate-[1.5deg]', '-rotate-[0.5deg]'];

const ITEMS_PER_PAGE = 20;

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── テキスト切り詰め検出フック ── */
function useIsClamped(ref: React.RefObject<HTMLDivElement | null>, text: string) {
  const [isClamped, setIsClamped] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 2);
  }, [ref, text]);
  return isClamped;
}

/* ── 個別付箋コンポーネント ── */
function StickyNote({
  memo,
  color,
  rotation,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  memo: MemoEntry;
  color: (typeof STICKY_COLORS)[number];
  rotation: string;
  isEditing: boolean;
  onStartEdit: (id: string, text: string, images?: string[]) => void;
  onSaveEdit: (text: string, images?: string[]) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClamped = useIsClamped(contentRef, memo.text);
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing) {
      setEditText(memo.text);
      setEditImages(memo.images ?? []);
    }
  }, [isEditing, memo.text, memo.images]);

  if (isEditing) {
    return (
      <div className={`${color.bg} ${color.border} border rounded-lg p-4 shadow-[var(--shadow-card)] sm:col-span-2`}>
        <RichTextEditor
          value={editText}
          onChange={setEditText}
          placeholder="メモを入力..."
          minHeight="100px"
          accentColor="cyan"
        />
        <div className="mt-2">
          <ImageAttachment images={editImages} onChange={setEditImages} maxImages={5} />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSaveEdit(editText.trim(), editImages.length > 0 ? editImages : undefined)}
            className="px-3 py-1.5 bg-accent-cyan/20 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/30 transition-colors"
          >
            保存
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative ${color.bg} ${color.border} border rounded-lg p-4
        shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]
        ${rotation} hover:rotate-0 transition-all duration-200 cursor-default`}
    >
      {/* ホバー時アクションボタン */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onStartEdit(memo.id, memo.text, memo.images); }}
          className="p-1 rounded bg-white/80 text-gray-500 hover:text-accent-cyan transition-colors"
          title="編集"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(memo.id); }}
          className="p-1 rounded bg-white/80 text-gray-500 hover:text-red-600 transition-colors"
          title="削除"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* メモ本文 */}
      <div
        ref={contentRef}
        className={`text-sm text-gray-800 break-words ${expanded ? '' : 'line-clamp-6'}`}
      >
        <RichTextDisplay html={memo.text} className="text-sm text-gray-800" />
      </div>

      {/* もっと見る / 折りたたむ */}
      {(isClamped || expanded) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-1 text-xs ${color.accent} hover:underline`}
        >
          {expanded ? '折りたたむ' : 'もっと見る'}
        </button>
      )}

      {/* 画像サムネイル */}
      {memo.images && memo.images.length > 0 && (
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {memo.images.slice(0, 2).map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-12 h-12 object-cover rounded border border-white/60"
              loading="lazy"
            />
          ))}
          {memo.images.length > 2 && (
            <div className="w-12 h-12 rounded border border-white/60 bg-white/50 flex items-center justify-center text-xs text-gray-500 font-medium">
              +{memo.images.length - 2}
            </div>
          )}
        </div>
      )}

      {/* 日時 */}
      <div className={`mt-2 text-xs ${color.accent}`}>
        {formatDateTime(memo.updatedAt)}
      </div>
    </div>
  );
}

/* ── メインコンポーネント ── */
interface Props {
  memos: MemoEntry[];
  onUpdate: (id: string, text: string, images?: string[]) => void;
  onDelete: (id: string) => void;
}

export function MemoList({ memos, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const startEdit = useCallback((id: string, _text: string, _images?: string[]) => {
    setEditingId(id);
  }, []);

  const saveEdit = useCallback((text: string, images?: string[]) => {
    if (editingId && (text || (images && images.length > 0))) {
      onUpdate(editingId, text, images);
    }
    setEditingId(null);
  }, [editingId, onUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  if (memos.length === 0) return null;

  const visibleMemos = memos.slice(0, visibleCount);
  const hasMore = visibleCount < memos.length;

  return (
    <div>
      {/* セクションヘッダー */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-sm font-semibold text-accent-cyan">保存済みメモ</h2>
        <span className="text-xs text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded-full">
          {memos.length}件
        </span>
      </div>

      {/* 付箋グリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visibleMemos.map((memo) => {
          const idx = hashId(memo.id);
          const color = STICKY_COLORS[idx % STICKY_COLORS.length];
          const rotation = ROTATIONS[idx % ROTATIONS.length];
          return (
            <StickyNote
              key={memo.id}
              memo={memo}
              color={color}
              rotation={rotation}
              isEditing={editingId === memo.id}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>

      {/* さらに表示 */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
            className="px-4 py-2 text-sm text-text-secondary hover:text-accent-cyan bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors"
          >
            さらに表示（残り {memos.length - visibleCount} 件）
          </button>
        </div>
      )}
    </div>
  );
}
