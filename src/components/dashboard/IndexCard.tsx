import type { MarketItem } from '../../types';
import { formatNumber, formatChange, formatPercent, getChangeColor } from '../../utils/formatters';
import { SparklineChart } from './SparklineChart';

interface IndexCardProps {
  item: MarketItem;
}

export function IndexCard({ item }: IndexCardProps) {
  const changeColor = getChangeColor(item.change);
  const sparkColor = item.change >= 0 ? 'var(--color-up)' : 'var(--color-down)';

  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl p-4 hover:border-accent-cyan/30 transition-all group">
      {/* 銘柄名 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary truncate">{item.nameJa}</span>
        <span className="text-[10px] text-text-secondary/60 font-mono">{item.name}</span>
      </div>

      {/* 現在値 */}
      <div className="font-mono text-xl font-semibold text-text-primary mb-1">
        {formatNumber(item.currentValue)}
      </div>

      {/* 前日比 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`font-mono text-sm ${changeColor}`}>
          {formatChange(item.change)}
        </span>
        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${changeColor} ${item.change >= 0 ? 'bg-up/10' : 'bg-down/10'}`}>
          {formatPercent(item.changePercent)}
        </span>
      </div>

      {/* スパークライン */}
      <div className="h-10">
        <SparklineChart data={item.sparklineData} color={sparkColor} />
      </div>
    </div>
  );
}
