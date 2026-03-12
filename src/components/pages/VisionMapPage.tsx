'use client';
import { useState, useRef } from 'react';
import { useVisionMap } from '@/src/hooks/useVisionMap';

export function VisionMapPage() {
  const { data, addDream, updateDream, deleteDream, addImage, deleteImage } = useVisionMap();
  const [newDream, setNewDream] = useState('');
  const [step, setStep] = useState<'dreams' | 'board'>('dreams');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAddDream = () => {
    if (!newDream.trim()) return;
    addDream(newDream.trim());
    setNewDream('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        addImage({
          dataUrl,
          caption: '',
          x: 50 + Math.random() * 200,
          y: 50 + Math.random() * 200,
          width: 200,
          height: 150,
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Vision Map</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('dreams')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${step === 'dreams' ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border'}`}
          >
            Step 1: 夢リスト
          </button>
          <button
            onClick={() => setStep('board')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${step === 'board' ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border'}`}
          >
            Step 2: ビジョンボード
          </button>
        </div>
      </div>

      {step === 'dreams' && (
        <div className="space-y-4">
          <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              夢・目標リスト
            </h2>
            <p className="text-xs text-text-secondary mb-4">叶えたい夢や目標を箇条書きで書き出しましょう。書き終わったら「Step 2: ビジョンボード」で画像を集めてビジュアル化しましょう。</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newDream}
                onChange={(e) => setNewDream(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddDream(); }}
                placeholder="夢や目標を入力..."
                className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={handleAddDream}
                className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors"
              >
                追加
              </button>
            </div>
            <div className="space-y-2">
              {data.dreams.length === 0 && (
                <p className="text-text-secondary/50 text-sm text-center py-8">まだ夢リストが空です。上の入力欄から追加しましょう！</p>
              )}
              {data.dreams.map((dream, idx) => (
                <div
                  key={dream.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${dream.done ? 'bg-up/5 border-up/20' : 'bg-bg-primary/50 border-border'}`}
                >
                  <span className="text-text-secondary/50 text-sm font-mono mt-0.5 w-6 text-right shrink-0">{idx + 1}.</span>
                  <input
                    type="checkbox"
                    checked={dream.done}
                    onChange={() => updateDream(dream.id, { done: !dream.done })}
                    className="mt-1 shrink-0"
                  />
                  {editingId === dream.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { updateDream(dream.id, { text: editText }); setEditingId(null); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => { updateDream(dream.id, { text: editText }); setEditingId(null); }}
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none border-b border-violet-500/50"
                    />
                  ) : (
                    <span
                      className={`flex-1 text-sm cursor-pointer ${dream.done ? 'line-through text-text-secondary/50' : 'text-text-primary'}`}
                      onClick={() => { setEditingId(dream.id); setEditText(dream.text); }}
                    >
                      {dream.text}
                    </span>
                  )}
                  <button
                    onClick={() => deleteDream(dream.id)}
                    className="text-text-secondary/30 hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {data.dreams.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
                <span>{data.dreams.filter((d) => d.done).length} / {data.dreams.length} 達成</span>
                <div className="flex-1 bg-bg-primary rounded-full h-1.5">
                  <div
                    className="bg-violet-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${(data.dreams.filter((d) => d.done).length / data.dreams.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'board' && (
        <div className="space-y-4">
          <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ビジョンボード
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors"
              >
                画像を追加
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {data.dreams.length > 0 && (
              <div className="mb-4 p-3 bg-bg-primary/50 rounded-lg border border-border">
                <p className="text-xs text-text-secondary mb-2 font-semibold">あなたの夢リスト:</p>
                <div className="flex flex-wrap gap-2">
                  {data.dreams.map((d) => (
                    <span key={d.id} className={`text-xs px-2 py-1 rounded-full ${d.done ? 'bg-up/20 text-up' : 'bg-violet-500/20 text-violet-300'}`}>
                      {d.text}
                    </span>
                  ))}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border bg-bg-primary">
                    <img src={img.dataUrl} alt={img.caption} className="w-full h-40 object-cover" />
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
