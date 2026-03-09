import type { FearGreedData } from '../../types';

interface FearGreedGaugeProps {
  data: FearGreedData;
}

const LABELS = [
  { min: 0, max: 20, label: 'Extreme Fear', labelJa: '極度の恐怖', color: '#FF1744' },
  { min: 20, max: 40, label: 'Fear', labelJa: '恐怖', color: '#FF6D00' },
  { min: 40, max: 60, label: 'Neutral', labelJa: '中立', color: '#FFD600' },
  { min: 60, max: 80, label: 'Greed', labelJa: '強欲', color: '#76FF03' },
  { min: 80, max: 100, label: 'Extreme Greed', labelJa: '極度の強欲', color: '#00C853' },
];

export function FearGreedGauge({ data }: FearGreedGaugeProps) {
  const angle = (data.value / 100) * 180 - 90; // -90 to 90 degrees
  const current = LABELS.find((l) => data.value >= l.min && data.value < l.max) || LABELS[4];

  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">恐怖・強欲指数</h3>

      {/* 半円ゲージ */}
      <div className="flex justify-center mb-4">
        <svg viewBox="0 0 200 120" className="w-48 h-auto">
          {/* 背景の半円弧 */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF1744" />
              <stop offset="25%" stopColor="#FF6D00" />
              <stop offset="50%" stopColor="#FFD600" />
              <stop offset="75%" stopColor="#76FF03" />
              <stop offset="100%" stopColor="#00C853" />
            </linearGradient>
          </defs>

          {/* ゲージの弧 */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* 針 */}
          <line
            x1="100"
            y1="100"
            x2={100 + 65 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 65 * Math.sin((angle * Math.PI) / 180) * -1}
            stroke="var(--color-text-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 中心点 */}
          <circle cx="100" cy="100" r="4" fill="var(--color-accent-cyan)" />

          {/* 数値 */}
          <text x="100" y="85" textAnchor="middle" className="text-2xl font-bold font-mono" fill="var(--color-text-primary)" fontSize="24">
            {data.value}
          </text>
        </svg>
      </div>

      {/* ラベル */}
      <div className="text-center mb-3">
        <span
          className="text-lg font-semibold px-3 py-1 rounded-full"
          style={{ color: current.color, backgroundColor: `${current.color}20` }}
        >
          {current.labelJa}
        </span>
      </div>

      {/* VIX表示 */}
      <div className="flex justify-center gap-4 text-xs text-text-secondary">
        <span>VIX: <span className="font-mono text-text-primary">{data.vix}</span></span>
      </div>

      {/* 凡例 */}
      <div className="flex justify-between mt-4 text-[10px] text-text-secondary">
        <span>極度の恐怖</span>
        <span>中立</span>
        <span>極度の強欲</span>
      </div>
    </div>
  );
}
