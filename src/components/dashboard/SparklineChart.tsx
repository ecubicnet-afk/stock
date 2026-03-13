import type { DataPoint } from '../../types';

interface SparklineChartProps {
  data: DataPoint[];
  color: string;
  width?: number;
  height?: number;
}

export function SparklineChart({ data, color, height = 40 }: SparklineChartProps) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${((max - v) / range) * height}`)
    .join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
