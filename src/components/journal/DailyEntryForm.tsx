import { useState, useEffect } from 'react';
import type { JournalEntry } from '../../types';
import { ImageAttachment } from '../common/ImageAttachment';

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

export function DailyEntryForm({ date, entry, onSave, onDelete }: Props) {
  const [marketOutlook, setMarketOutlook] = useState('');
  const [conditionRating, setConditionRating] = useState(5);
  const [disciplineRating, setDisciplineRating] = useState(5);
  const [volatilityRating, setVolatilityRating] = useState(5);
  const [fearRating, setFearRating] = useState(5);
  const [asExpectedRating, setAsExpectedRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    setMarketOutlook(entry?.marketOutlook ?? '');
    setConditionRating(entry?.conditionRating ?? 5);
    setDisciplineRating(entry?.disciplineRating ?? 5);
    setVolatilityRating(entry?.volatilityRating ?? 5);
    setFearRating(entry?.fearRating ?? 5);
    setAsExpectedRating(entry?.asExpectedRating ?? 5);
    setNotes(entry?.notes ?? '');
    setImages(entry?.images ?? []);
  }, [entry, date]);

  const handleSave = () => {
    onSave(date, {
      marketOutlook,
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

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${dt.getMonth() + 1}/${dt.getDate()} (${days[dt.getDay()]})`;
  };

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

      {/* Main content: compact images left, text right */}
      <div className="flex gap-3">
        {/* Left: images column (compact vertical strip) */}
        <div className="shrink-0 w-[76px]">
          <ImageAttachment images={images} onChange={setImages} maxImages={5} />
        </div>

        {/* Right: text inputs */}
        <div className="flex-1 space-y-2 min-w-0">
          <div>
            <label className="block text-xs text-text-secondary mb-1">相場観・マーケット所感</label>
            <textarea
              value={marketOutlook}
              onChange={(e) => setMarketOutlook(e.target.value)}
              className="w-full h-16 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-secondary/50"
              placeholder="今日のマーケットの見通しや所感..."
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">メモ・反省点</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-16 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-secondary/50"
              placeholder="今日の反省点、気づき、次回への教訓..."
            />
          </div>
        </div>
      </div>

      {/* Ratings - 10 point scale */}
      <div className="space-y-1.5 pt-1">
        <RatingSelector label="コンディション" value={conditionRating} onChange={setConditionRating} color="bg-accent-cyan" />
        <RatingSelector label="規律性" value={disciplineRating} onChange={setDisciplineRating} color="bg-up" />
        <RatingSelector label="ボラティリティ" value={volatilityRating} onChange={setVolatilityRating} color="bg-amber-500" />
        <RatingSelector label="恐怖心" value={fearRating} onChange={setFearRating} color="bg-down" />
        <RatingSelector label="想定通り" value={asExpectedRating} onChange={setAsExpectedRating} color="bg-accent-gold" />
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 transition-colors"
      >
        保存
      </button>
    </div>
  );
}
