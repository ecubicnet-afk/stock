import { useState } from 'react';
import { ImageAttachment, ImageThumbnails } from '../common/ImageAttachment';
import { RichTextEditor } from '../common/RichTextEditor';
import { RichTextDisplay } from '../common/RichTextDisplay';
import type { MemoEntry } from '../../types';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  memos: MemoEntry[];
  onUpdate: (id: string, text: string, images?: string[]) => void;
  onDelete: (id: string) => void;
}

export function MemoList({ memos, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  const startEdit = (id: string, text: string, images?: string[]) => {
    setEditingId(id);
    setEditText(text);
    setEditImages(images ?? []);
  };

  const saveEdit = () => {
    if (editingId && (editText.trim() || editImages.length > 0)) {
      onUpdate(editingId, editText.trim(), editImages.length > 0 ? editImages : undefined);
    }
    setEditingId(null);
    setEditText('');
    setEditImages([]);
  };

  if (memos.length === 0) return null;

  return (
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
                <RichTextEditor
                  value={editText}
                  onChange={setEditText}
                  placeholder="メモを入力..."
                  minHeight="80px"
                  accentColor="cyan"
                />
                <div className="mt-2">
                  <ImageAttachment images={editImages} onChange={setEditImages} maxImages={5} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={saveEdit} className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/30">保存</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-bg-primary text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
                </div>
              </>
            ) : (
              <>
                <RichTextDisplay html={memo.text} className="text-sm text-text-primary" />
                <ImageThumbnails images={memo.images} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-text-secondary/60">{formatDateTime(memo.updatedAt)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(memo.id, memo.text, memo.images)} className="text-xs text-text-secondary hover:text-accent-cyan transition-colors">編集</button>
                    <button onClick={() => onDelete(memo.id)} className="text-xs text-text-secondary hover:text-down transition-colors">削除</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
