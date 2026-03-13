'use client';
import { useState } from 'react';
import { useTradeMethods } from '@/src/hooks/useTradeMethods';
import { RichTextEditor } from '@/src/components/common/RichTextEditor';
import { RichTextDisplay } from '@/src/components/common/RichTextDisplay';
import { ImageAttachment, ImageThumbnails } from '@/src/components/common/ImageAttachment';

export function TradeMethodsPage() {
  const { methods, addMethod, updateMethod, deleteMethod } = useTradeMethods();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = [...new Set(methods.flatMap((m) => m.tags))].sort();

  const handleSubmit = () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    const tags = newTags.split(/[,、\s]+/).filter(Boolean);
    addMethod(newTitle.trim() || '無題', newContent, tags);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setNewImages([]);
    // Save images to the newly created entry
    if (newImages.length > 0) {
      // The method was just added at index 0 in the array
      setTimeout(() => {
        const latest = methods[0];
        if (latest) updateMethod(latest.id, { images: newImages });
      }, 100);
    }
  };

  const startEdit = (id: string) => {
    const m = methods.find((x) => x.id === id);
    if (!m) return;
    setEditingId(id);
    setEditTitle(m.title);
    setEditContent(m.content);
    setEditTags(m.tags.join(', '));
    setEditImages(m.images || []);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const tags = editTags.split(/[,、\s]+/).filter(Boolean);
    updateMethod(editingId, { title: editTitle, content: editContent, tags, images: editImages });
    setEditingId(null);
  };

  const filtered = filterTag ? methods.filter((m) => m.tags.includes(filterTag)) : methods;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-6">トレード手法メモ / 鬼月</h1>

      {/* New Entry Form */}
      <div className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-cyan-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          新しい手法メモを追加
        </h2>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="手法名 / タイトル"
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-cyan-500/50 mb-3"
        />
        <RichTextEditor
          value={newContent}
          onChange={setNewContent}
          placeholder="手法の詳細、ルール、エントリー条件、エグジット条件など..."
          minHeight="150px"
          accentColor="cyan"
        />
        <div className="mt-3">
          <ImageAttachment images={newImages} onChange={setNewImages} maxImages={5} />
        </div>
        <input
          type="text"
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          placeholder="タグ（カンマ区切り）例: スキャルピング, 移動平均線, 鬼月"
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-cyan-500/50 mt-3"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-100 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${!filterTag ? 'bg-cyan-100 text-cyan-700' : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border'}`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${filterTag === tag ? 'bg-cyan-100 text-cyan-700' : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Method List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-text-secondary/50 py-12 text-sm">まだ手法メモはありません</p>
        )}
        {filtered.map((m) => (
          <div key={m.id} className="bg-bg-card shadow-[var(--shadow-card)] border border-border rounded-xl p-4">
            {editingId === m.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary mb-2 focus:outline-none focus:border-cyan-500/50"
                />
                <RichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="内容..."
                  minHeight="100px"
                  accentColor="cyan"
                />
                <div className="mt-2">
                  <ImageAttachment images={editImages} onChange={setEditImages} maxImages={5} />
                </div>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="タグ（カンマ区切り）"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary mt-2 focus:outline-none focus:border-cyan-500/50"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">キャンセル</button>
                  <button onClick={saveEdit} className="px-3 py-1.5 text-xs bg-cyan-50 text-cyan-700 rounded hover:bg-cyan-100">保存</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{m.title}</h3>
                    {m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-text-secondary">
                      {new Date(m.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                    <button onClick={() => startEdit(m.id)} className="text-text-secondary/50 hover:text-cyan-700 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteMethod(m.id)} className="text-text-secondary/50 hover:text-red-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {m.content && <RichTextDisplay html={m.content} className="text-sm text-text-secondary" />}
                {m.images && m.images.length > 0 && (
                  <div className="mt-2">
                    <ImageThumbnails images={m.images} />
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
