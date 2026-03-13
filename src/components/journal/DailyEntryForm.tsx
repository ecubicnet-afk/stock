'use client';
import { useState, useEffect, useRef } from 'react';
import { RichTextEditor } from '../common/RichTextEditor';
import { RichTextDisplay } from '../common/RichTextDisplay';
import type { JournalEntry } from '../../types';
import { callGemini } from '../../services/geminiApi';

interface SaveData {
  marketOutlook: string;
  conditionRating: number;
  disciplineRating: number;
  volatilityRating: number;
  fearRating: number;
  asExpectedRating: number;
  notes: string;
  images?: string[];
}

// Merge legacy separate fields into single notes
function mergeNotes(entry: JournalEntry | undefined): string {
  if (!entry) return '';
  const outlook = entry.marketOutlook?.trim() ?? '';
  const notes = entry.notes?.trim() ?? '';
  if (outlook && notes) return `${outlook}\n\n${notes}`;
  return outlook || notes;
}

interface Props {
  date: string;
  entry: JournalEntry | undefined;
  onSave: (date: string, data: SaveData) => void;
  onDelete?: (id: string) => void;
}

function RatingSelector({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-text-secondary w-20 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-5 h-5 rounded text-[10px] font-semibold transition-all ${
              n <= value
                ? `${color} text-white`
                : 'bg-bg-primary/50 text-text-secondary/40 hover:bg-bg-primary'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function LightboxModal({ images, currentIdx, onClose, onNavigate }: {
  images: string[];
  currentIdx: number;
  onClose: () => void;
  onNavigate?: (idx: number) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[currentIdx]}
          alt="拡大表示"
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-bg-card border border-border rounded-full text-text-primary flex items-center justify-center hover:bg-bg-primary"
        >
          ×
        </button>
        {images.length > 1 && onNavigate && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={`w-2 h-2 rounded-full ${i === currentIdx ? 'bg-accent-cyan' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function organizeJournalTextWithAI(html: string): Promise<string> {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const plainText = tmp.textContent || tmp.innerText || '';
  if (!plainText.trim()) return html;

  const prompt = `あなたは投資ジャーナルの整理アシスタントです。以下のテキストを読み、適切なセクションに分類して見やすく整理してください。

## ルール
- 以下のセクションに分類してください（該当する内容がないセクションは省略）:
  - 市場概況: 相場状況、指数の動き、為替、金利など
  - トレード振り返り: 実際の売買、エントリー・決済の判断
  - 反省点: ミス、改善点、感情的な判断
  - 明日の計画: 今後の戦略、注目銘柄、シナリオ
  - その他: 上記に当てはまらない重要事項
- 元の内容を変えず、整理・要約してください
- 箇条書きで見やすくしてください

## 出力形式（HTMLで返してください）
<div style="margin-bottom:12px"><div style="font-size:14px;font-weight:bold;color:#22d3ee;margin-bottom:4px">■ セクション名</div><div style="font-size:12px">・内容1</div><div style="font-size:12px">・内容2</div></div>

## 入力テキスト
${plainText}`;

  return callGemini(prompt);
}

export function DailyEntryForm({ date, entry, onSave, onDelete }: Props) {
  // Settings no longer needed - API keys managed server-side
  const [conditionRating, setConditionRating] = useState(5);
  const [disciplineRating, setDisciplineRating] = useState(5);
  const [volatilityRating, setVolatilityRating] = useState(5);
  const [fearRating, setFearRating] = useState(5);
  const [asExpectedRating, setAsExpectedRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConditionRating(entry?.conditionRating ?? 5);
    setDisciplineRating(entry?.disciplineRating ?? 5);
    setVolatilityRating(entry?.volatilityRating ?? 5);
    setFearRating(entry?.fearRating ?? 5);
    setAsExpectedRating(entry?.asExpectedRating ?? 5);
    setNotes(mergeNotes(entry));
    setImages(entry?.images ?? []);
    setCurrentImageIdx(0);
    setIsEditingNotes(false);
  }, [entry, date]);

  const handleSave = () => {
    onSave(date, {
      marketOutlook: '',
      conditionRating,
      disciplineRating,
      volatilityRating,
      fearRating,
      asExpectedRating,
      notes,
      images: images.length > 0 ? images : undefined,
    });
  };

  const handleDelete = () => {
    if (entry && onDelete && confirm('この日のジャーナルを削除しますか？')) {
      onDelete(entry.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = 5 - images.length;
    const toProcess = files.slice(0, remaining);
    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImages((prev) => {
          const next = [...prev, result];
          setCurrentImageIdx(next.length - 1);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    if (currentImageIdx >= next.length) {
      setCurrentImageIdx(Math.max(0, next.length - 1));
    }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${dt.getMonth() + 1}/${dt.getDate()} (${days[dt.getDay()]})`;
  };

  const hasImages = images.length > 0;

  return (
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-accent-cyan flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          日次ジャーナル — {formatDate(date)}
        </h3>
        {entry && onDelete && (
          <button
            onClick={handleDelete}
            className="text-xs text-text-secondary/40 hover:text-down transition-colors"
            title="この日のジャーナルを削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Split view: large image left, journal right */}
      <div className={hasImages ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
        {/* Left: Large image viewer */}
        {hasImages && (
          <div className="space-y-2">
            {/* Main large image */}
            <div
              className="relative bg-black/20 rounded-lg overflow-hidden cursor-pointer border border-border"
              onClick={() => setLightboxIdx(currentImageIdx)}
            >
              <img
                src={images[currentImageIdx]}
                alt={`チャート${currentImageIdx + 1}`}
                className="w-full aspect-[16/10] object-contain"
              />
              {/* Navigation arrows for multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIdx((currentImageIdx - 1 + images.length) % images.length); }}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 text-sm"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIdx((currentImageIdx + 1) % images.length); }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 text-sm"
                  >
                    ›
                  </button>
                </>
              )}
              <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                {currentImageIdx + 1}/{images.length}
              </div>
            </div>

            {/* Thumbnail strip for multiple images */}
            {images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto">
                {images.map((img, i) => (
                  <div key={i} className="relative group shrink-0">
                    <img
                      src={img}
                      alt={`サムネイル${i + 1}`}
                      className={`w-12 h-12 rounded object-cover cursor-pointer border-2 transition-colors ${
                        i === currentImageIdx ? 'border-accent-cyan' : 'border-border hover:border-accent-cyan/50'
                      }`}
                      onClick={() => setCurrentImageIdx(i)}
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Single image: show remove button */}
            {images.length === 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemoveImage(0)}
                  className="text-[11px] text-text-secondary/50 hover:text-down transition-colors"
                >
                  画像を削除
                </button>
              </div>
            )}

            {/* Add more images button */}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-text-secondary/60 hover:text-accent-cyan transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                画像を追加
              </button>
            )}
          </div>
        )}

        {/* Right: Text input + ratings */}
        <div className="space-y-2">
          {isEditingNotes ? (
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              onBlur={() => setIsEditingNotes(false)}
              placeholder="相場観 / 所感 / 反省点 / 改善..."
              minHeight="6rem"
              accentColor="cyan"
            />
          ) : (
            <div
              onClick={() => setIsEditingNotes(true)}
              className="w-full min-h-[6rem] bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary cursor-text"
            >
              {notes ? (
                <RichTextDisplay html={notes} className="text-sm text-text-primary" />
              ) : (
                <span className="text-text-secondary/50">相場観 / 所感 / 反省点 / 改善...</span>
              )}
            </div>
          )}

          {/* Ratings */}
          <div className="space-y-1">
            <RatingSelector label="コンディション" value={conditionRating} onChange={setConditionRating} color="bg-accent-cyan" />
            <RatingSelector label="規律性" value={disciplineRating} onChange={setDisciplineRating} color="bg-up" />
            <RatingSelector label="ボラティリティ" value={volatilityRating} onChange={setVolatilityRating} color="bg-amber-500" />
            <RatingSelector label="恐怖心" value={fearRating} onChange={setFearRating} color="bg-down" />
            <RatingSelector label="想定通り" value={asExpectedRating} onChange={setAsExpectedRating} color="bg-accent-gold" />
          </div>

          <div className="flex items-center gap-2">
            {/* Upload button (when no images yet) */}
            {!hasImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-text-secondary/60 hover:text-accent-cyan transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                画像を添付
              </button>
            )}

            <button
              onClick={async () => {
                setIsOrganizing(true);
                try {
                  const organized = await organizeJournalTextWithAI(notes);
                  setNotes(organized);
                } catch (err) {
                  alert('整理に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'));
                } finally {
                  setIsOrganizing(false);
                }
              }}
              disabled={!notes.trim() || isOrganizing}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                notes.trim() && !isOrganizing
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-bg-primary/30 text-text-secondary/30 cursor-not-allowed'
              }`}
            >
              {isOrganizing ? 'AI整理中...' : 'AI整理'}
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <LightboxModal
          images={images}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={images.length > 1 ? setLightboxIdx : undefined}
        />
      )}
    </div>
  );
}
