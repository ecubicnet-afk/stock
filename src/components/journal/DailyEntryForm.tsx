import { useState, useEffect } from 'react';
import type { JournalEntry } from '../../types';
import { ImageAttachment } from '../common/ImageAttachment';

interface Props {
  date: string;
  entry: JournalEntry | undefined;
  onSave: (date: string, data: { marketOutlook: string; healthRating: number; mentalRating: number; notes: string; images?: string[] }) => void;
}

function RatingSelector({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary w-16 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
              n <= value
                ? `${color} text-white`
                : 'bg-bg-primary/50 text-text-secondary hover:bg-bg-primary'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DailyEntryForm({ date, entry, onSave }: Props) {
  const [marketOutlook, setMarketOutlook] = useState('');
  const [healthRating, setHealthRating] = useState(3);
  const [mentalRating, setMentalRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    setMarketOutlook(entry?.marketOutlook ?? '');
    setHealthRating(entry?.healthRating ?? 3);
    setMentalRating(entry?.mentalRating ?? 3);
    setNotes(entry?.notes ?? '');
    setImages(entry?.images ?? []);
  }, [entry, date]);

  const handleSave = () => {
    onSave(date, { marketOutlook, healthRating, mentalRating, notes, images: images.length > 0 ? images : undefined });
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${dt.getMonth() + 1}/${dt.getDate()} (${days[dt.getDay()]})`;
  };

  return (
    <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-accent-cyan flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        日次ジャーナル — {formatDate(date)}
      </h3>

      <div>
        <label className="block text-xs text-text-secondary mb-1">相場観・マーケット所感</label>
        <textarea
          value={marketOutlook}
          onChange={(e) => setMarketOutlook(e.target.value)}
          className="w-full h-16 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-secondary/50"
          placeholder="今日のマーケットの見通しや所感..."
        />
      </div>

      <div className="space-y-2">
        <RatingSelector label="体調" value={healthRating} onChange={setHealthRating} color="bg-up" />
        <RatingSelector label="メンタル" value={mentalRating} onChange={setMentalRating} color="bg-accent-cyan" />
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

      <ImageAttachment images={images} onChange={setImages} maxImages={5} />

      <button
        onClick={handleSave}
        className="px-4 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 transition-colors"
      >
        保存
      </button>
    </div>
  );
}
