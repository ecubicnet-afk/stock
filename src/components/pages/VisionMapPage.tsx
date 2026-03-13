'use client';
import { useState, useRef, useMemo } from 'react';
import { useVisionMap } from '@/src/hooks/useVisionMap';
import { Card, CardHeader } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';

const CATEGORIES = [
  { value: 'investment', label: '投資', color: 'cyan' as const },
  { value: 'life', label: '生活', color: 'success' as const },
  { value: 'learning', label: '学習', color: 'gold' as const },
  { value: 'travel', label: '旅行', color: 'violet' as const },
];

export function VisionMapPage() {
  const { data, addDream, updateDream, deleteDream, addImage, updateImage, deleteImage } = useVisionMap();
  const [newDream, setNewDream] = useState('');
  const [newCategory, setNewCategory] = useState('investment');
  const [step, setStep] = useState<'dreams' | 'board'>('dreams');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);

  const handleAddDream = () => {
    if (!newDream.trim()) return;
    addDream(newDream.trim());
    // Apply category via update after creation
    const tempId = setTimeout(() => {
      const latest = data.dreams[data.dreams.length];
      if (latest) updateDream(latest.id, { category: newCategory });
    }, 50);
    setNewDream('');
    return () => clearTimeout(tempId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const { compressImage } = await import('@/src/components/common/ImageAttachment');
    const { uploadImage } = await import('@/src/services/firebaseStorage');
    const { isFirebaseConfigured } = await import('@/src/services/firebase');
    let settings: import('@/src/types').Settings | null = null;
    try {
      const raw = localStorage.getItem('stock-app-settings');
      if (raw) { const s = JSON.parse(raw); if (isFirebaseConfigured(s)) settings = s; }
    } catch { /* ignore */ }

    const useStorage = !!settings;
    for (const file of Array.from(files)) {
      const { dataUrl, blob } = await compressImage(file, useStorage);
      let finalUrl = dataUrl;
      if (settings) {
        try { finalUrl = await uploadImage(settings, blob); } catch { /* fallback to base64 */ }
      }
      addImage({ dataUrl: finalUrl, caption: '', x: 0, y: 0, width: 200, height: 150 });
    }
    e.target.value = '';
  };

  const filteredDreams = useMemo(() => {
    if (!filterCategory) return data.dreams;
    return data.dreams.filter(d => (d.category || 'investment') === filterCategory);
  }, [data.dreams, filterCategory]);

  const totalDone = data.dreams.filter(d => d.done).length;
  const totalCount = data.dreams.length;
  const progress = totalCount > 0 ? (totalDone / totalCount) * 100 : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Vision Map
          </h1>
          {totalCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-text-secondary">{totalDone} / {totalCount} 達成</span>
              <div className="w-32 bg-bg-primary rounded-full h-1.5">
                <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-violet-700 font-mono">{progress.toFixed(0)}%</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={step === 'dreams' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStep('dreams')}
            className={step === 'dreams' ? '!bg-violet-50 !text-violet-700 !border-violet-300' : ''}
          >
            Step 1: 夢リスト
          </Button>
          <Button
            variant={step === 'board' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStep('board')}
            className={step === 'board' ? '!bg-violet-50 !text-violet-700 !border-violet-300' : ''}
          >
            Step 2: ビジョンボード
          </Button>
        </div>
      </div>

      {step === 'dreams' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="夢・目標リスト"
              accentColor="text-violet-700"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
            <p className="text-xs text-text-secondary mb-4">叶えたい夢や目標を書き出し、カテゴリ別に整理しましょう。</p>

            {/* Input */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-bg-primary border border-border rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-violet-300"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input
                type="text"
                value={newDream}
                onChange={(e) => setNewDream(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddDream(); }}
                placeholder="夢や目標を入力..."
                className="flex-1 min-w-0 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-violet-300"
              />
              <Button variant="secondary" size="sm" onClick={handleAddDream} className="!bg-violet-50 !text-violet-700">
                追加
              </Button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${!filterCategory ? 'bg-violet-50 text-violet-700' : 'text-text-muted hover:text-text-secondary'}`}
              >
                全て ({totalCount})
              </button>
              {CATEGORIES.map(c => {
                const count = data.dreams.filter(d => (d.category || 'investment') === c.value).length;
                return (
                  <button
                    key={c.value}
                    onClick={() => setFilterCategory(c.value)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${filterCategory === c.value ? 'bg-violet-50 text-violet-700' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Dream list */}
            <div className="space-y-2">
              {filteredDreams.length === 0 && (
                <p className="text-text-secondary/50 text-sm text-center py-8">
                  {filterCategory ? 'このカテゴリにはまだ目標がありません' : 'まだ夢リストが空です。上の入力欄から追加しましょう！'}
                </p>
              )}
              {filteredDreams.map((dream, idx) => {
                const cat = CATEGORIES.find(c => c.value === (dream.category || 'investment'));
                return (
                  <div
                    key={dream.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${dream.done ? 'bg-up/5 border-up/20' : 'bg-bg-primary/50 border-border hover:border-violet-200'}`}
                  >
                    <span className="text-text-secondary/50 text-sm font-mono mt-0.5 w-6 text-right shrink-0">{idx + 1}.</span>
                    <input type="checkbox" checked={dream.done} onChange={() => updateDream(dream.id, { done: !dream.done })} className="mt-1 shrink-0" />
                    {editingId === dream.id ? (
                      <input
                        type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { updateDream(dream.id, { text: editText }); setEditingId(null); } if (e.key === 'Escape') setEditingId(null); }}
                        onBlur={() => { updateDream(dream.id, { text: editText }); setEditingId(null); }}
                        autoFocus className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none border-b border-violet-300"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm cursor-pointer ${dream.done ? 'line-through text-text-secondary/50' : 'text-text-primary'}`}
                        onClick={() => { setEditingId(dream.id); setEditText(dream.text); }}
                      >{dream.text}</span>
                    )}
                    {cat && <Badge variant={cat.color}>{cat.label}</Badge>}
                    <button onClick={() => deleteDream(dream.id)} className="text-text-secondary/30 hover:text-red-600 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {step === 'board' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="ビジョンボード"
              accentColor="text-violet-700"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              action={<Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="!bg-violet-50 !text-violet-700">画像を追加</Button>}
            />
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

            {data.dreams.length > 0 && (
              <div className="mb-4 p-3 bg-bg-primary/50 rounded-lg border border-border">
                <p className="text-xs text-text-secondary mb-2 font-semibold">あなたの夢リスト:</p>
                <div className="flex flex-wrap gap-2">
                  {data.dreams.map((d) => {
                    const cat = CATEGORIES.find(c => c.value === (d.category || 'investment'));
                    return <Badge key={d.id} variant={d.done ? 'success' : (cat?.color || 'violet')}>{d.done && '✓ '}{d.text}</Badge>;
                  })}
                </div>
              </div>
            )}

            {data.images.length === 0 ? (
              <div className="text-center py-16 text-text-secondary/50">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">「画像を追加」ボタンから夢をイメージする画像を集めましょう</p>
                <p className="text-xs mt-1">理想の生活、行きたい場所、欲しいもの、なりたい姿...</p>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {data.images.map((img) => (
                  <div key={img.id} className="break-inside-avoid group relative rounded-lg overflow-hidden border border-border bg-bg-primary">
                    <img src={img.dataUrl} alt={img.caption || 'Vision board image'} className="w-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                      {editingCaptionId === img.id ? (
                        <input
                          type="text" defaultValue={img.caption} autoFocus
                          onBlur={(e) => { updateImage(img.id, { caption: e.target.value }); setEditingCaptionId(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { updateImage(img.id, { caption: (e.target as HTMLInputElement).value }); setEditingCaptionId(null); } }}
                          className="w-full bg-transparent text-xs text-white placeholder:text-white/50 focus:outline-none border-b border-white/30"
                          placeholder="キャプションを入力..."
                        />
                      ) : (
                        <p className="text-xs text-white/80 cursor-pointer hover:text-white truncate" onClick={() => setEditingCaptionId(img.id)}>
                          {img.caption || 'クリックしてキャプション追加...'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white/70 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
