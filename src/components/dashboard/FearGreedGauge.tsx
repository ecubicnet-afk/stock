'use client';
import type { FearGreedData } from '../../types';

interface FearGreedGaugeProps {
  data: FearGreedData;
}

const ZONES = [
  { min: 0, max: 20, label: '極度の\n恐怖', labelJa: '極度の恐怖', color: '#DC2626' },
  { min: 20, max: 40, label: '恐怖', labelJa: '恐怖', color: '#F97316' },
  { min: 40, max: 60, label: '中立', labelJa: '中立', color: '#EAB308' },
  { min: 60, max: 80, label: '強欲', labelJa: '強欲', color: '#84CC16' },
  { min: 80, max: 100, label: '極度の\n強欲', labelJa: '極度の強欲', color: '#22C55E' },
];

const TICK_VALUES = [0, 25, 50, 75, 100];

// Center and radius for the gauge arc
const CX = 160;
const CY = 150;
const R = 120;
const STROKE_W = 28;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// Map value (0-100) to angle (180=left to 0=right, i.e. standard math angles)
function valueToAngle(value: number) {
  return 180 - (value / 100) * 180;
}

export function FearGreedGauge({ data }: FearGreedGaugeProps) {
  const current = ZONES.find((z) => data.value >= z.min && data.value < z.max) || ZONES[4];
  const needleAngle = valueToAngle(data.value);
  const needleTip = polarToCartesian(CX, CY, R - STROKE_W / 2 - 8, needleAngle);
  // Triangle base points (perpendicular to needle direction)
  const baseOffset = 6;
  const perpAngle1 = needleAngle + 90;
  const perpAngle2 = needleAngle - 90;
  const base1 = polarToCartesian(CX, CY, baseOffset, perpAngle1);
  const base2 = polarToCartesian(CX, CY, baseOffset, perpAngle2);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-2">恐怖・強欲指数</h3>
      <p className="text-[11px] text-text-secondary/60 mb-3">CNN Fear & Greed Index</p>

      {/* SVG Gauge */}
      <div className="flex justify-center">
        <svg viewBox="0 0 320 195" className="w-full max-w-[320px] h-auto">
          {/* Zone arcs */}
          {ZONES.map((zone, i) => {
            const startAngle = valueToAngle(zone.max); // note: reversed because angles go counter-clockwise
            const endAngle = valueToAngle(zone.min);
            return (
              <path
                key={i}
                d={describeArc(CX, CY, R, startAngle, endAngle)}
                fill="none"
                stroke={zone.color}
                strokeWidth={STROKE_W}
                strokeLinecap="butt"
              />
            );
          })}

          {/* Zone separator lines */}
          {[20, 40, 60, 80].map((val) => {
            const angle = valueToAngle(val);
            const outer = polarToCartesian(CX, CY, R + STROKE_W / 2, angle);
            const inner = polarToCartesian(CX, CY, R - STROKE_W / 2, angle);
            return (
              <line
                key={val}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="var(--color-bg-primary)"
                strokeWidth="2"
              />
            );
          })}

          {/* Tick marks and values */}
          {TICK_VALUES.map((val) => {
            const angle = valueToAngle(val);
            const tickOuter = polarToCartesian(CX, CY, R + STROKE_W / 2 + 3, angle);
            const tickEnd = polarToCartesian(CX, CY, R + STROKE_W / 2 + 8, angle);
            const labelPos = polarToCartesian(CX, CY, R + STROKE_W / 2 + 18, angle);
            return (
              <g key={val}>
                <line
                  x1={tickOuter.x} y1={tickOuter.y}
                  x2={tickEnd.x} y2={tickEnd.y}
                  stroke="var(--color-text-secondary)"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--color-text-secondary)"
                  fontSize="10"
                  opacity="0.7"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Zone labels on the arc */}
          {ZONES.map((zone, i) => {
            const midVal = (zone.min + zone.max) / 2;
            const angle = valueToAngle(midVal);
            const labelPos = polarToCartesian(CX, CY, R, angle);
            const lines = zone.label.split('\n');
            return (
              <g key={`label-${i}`}>
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={labelPos.x}
                    y={labelPos.y + (li - (lines.length - 1) / 2) * 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.7)"
                    fontSize="8"
                    fontWeight="700"
                    letterSpacing="0.5"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Needle (triangle pointer) */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
            fill="var(--color-text-primary)"
          />
          {/* Needle center circle */}
          <circle cx={CX} cy={CY} r="8" fill="var(--color-text-primary)" />
          <circle cx={CX} cy={CY} r="4" fill="var(--color-bg-card)" />

          {/* Score value below gauge */}
          <text
            x={CX}
            y={CY + 35}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-text-primary)"
            fontSize="36"
            fontWeight="800"
            fontFamily="monospace"
          >
            {data.value}
          </text>
        </svg>
      </div>

      {/* Label badge */}
      <div className="text-center mt-1 mb-3">
        <span
          className="text-base font-bold px-4 py-1.5 rounded-full inline-block"
          style={{ color: current.color, backgroundColor: `${current.color}20` }}
        >
          {current.labelJa}
        </span>
      </div>

      {/* VIX */}
      <div className="flex justify-center text-xs text-text-secondary">
        <span>VIX: <span className="font-mono text-text-primary font-medium">{data.vix}</span></span>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-3 text-[10px] text-text-secondary/60 px-2">
        <span>極度の恐怖</span>
        <span>中立</span>
        <span>極度の強欲</span>
      </div>
    </div>
  );
}
