'use client';
import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { OHLCDataPoint } from '../../types';

interface CandlestickChartProps {
  data: OHLCDataPoint[];
}

interface CandleShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: OHLCDataPoint;
  yAxis?: { scale: (v: number) => number };
  [key: string]: unknown;
}

function CandleShape(props: CandleShapeProps) {
  const { x = 0, width = 0, payload, yAxis } = props;
  if (!payload || !yAxis?.scale) return null;

  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp ? '#00c853' : '#ff1744';

  const yHigh = yAxis.scale(high);
  const yLow = yAxis.scale(low);
  const yOpen = yAxis.scale(open);
  const yClose = yAxis.scale(close);

  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);
  const cx = x + width / 2;

  return (
    <g>
      {/* Wick (high-low line) */}
      <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1} />
      {/* Body (open-close rect) */}
      <rect
        x={x + width * 0.1}
        y={bodyTop}
        width={width * 0.8}
        height={bodyHeight}
        fill={isUp ? 'transparent' : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: OHLCDataPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;
  return (
    <div className="bg-bg-secondary/95 border border-border rounded-lg p-3 text-xs shadow-xl">
      <div className="text-text-secondary mb-1.5 font-mono">{d.date}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-text-secondary">始値</span>
        <span className="text-text-primary font-mono text-right">{d.open.toLocaleString()}</span>
        <span className="text-text-secondary">高値</span>
        <span className="text-up font-mono text-right">{d.high.toLocaleString()}</span>
        <span className="text-text-secondary">安値</span>
        <span className="text-down font-mono text-right">{d.low.toLocaleString()}</span>
        <span className="text-text-secondary">終値</span>
        <span className={`font-mono text-right ${isUp ? 'text-up' : 'text-down'}`}>{d.close.toLocaleString()}</span>
        <span className="text-text-secondary">出来高</span>
        <span className="text-text-primary font-mono text-right">{(d.volume / 1e6).toFixed(0)}M</span>
      </div>
    </div>
  );
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const { priceMin, priceMax, volumeMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let vMax = 0;
    for (const d of data) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
      if (d.volume > vMax) vMax = d.volume;
    }
    const padding = (max - min) * 0.05;
    return {
      priceMin: Math.floor(min - padding),
      priceMax: Math.ceil(max + padding),
      volumeMax: vMax * 5,
    };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => v.slice(5)}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
          tickLine={false}
          interval={Math.floor(data.length / 8)}
        />
        <YAxis
          yAxisId="price"
          domain={[priceMin, priceMax]}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => v.toLocaleString()}
          width={70}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          domain={[0, volumeMax]}
          hide
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Volume bars */}
        <Bar yAxisId="volume" dataKey="volume" opacity={0.15} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.close >= entry.open ? '#00c853' : '#ff1744'} />
          ))}
        </Bar>

        {/* Candlestick bodies - use close as dataKey for positioning, custom shape draws the full candle */}
        <Bar
          yAxisId="price"
          dataKey="close"
          shape={<CandleShape />}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
