'use client';
import type { MarketItem } from '../../types';
import { formatNumber, formatChange, formatPercent, getChangeColor } from '../../utils/formatters';
import { SparklineChart } from './SparklineChart';
import { useMarketOpenStatus } from '../../hooks/useMarketOpenStatus';

interface IndexCardProps {
  item: MarketItem;
}

export function IndexCard({ item }: IndexCardProps) {
  const changeColor = getChangeColor(item.change);
  const sparkColor = item.change >= 0 ? 'var(--color-up)' : 'var(--color-down)';
  const marketOpen = useMarketOpenStatus(item.id);

  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl p-4 hover:border-accent-cyan/30 transition-all group">
      {/* 銘柄名 + 市場開閉 + データソース */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              marketOpen ? 'bg-up animate-pulse' : 'bg-text-secondary/40'
            }`}
            title={marketOpen ? '開場中' : '閉場'}
          />
          <span className="text-xs text-text-secondary truncate">{item.nameJa}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <span className="text-[10px] text-text-secondary/60 font-mono">{item.name}</span>
          {item.dataSource === 'live' && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-up/15 text-up">LIVE</span>
          )}
          {item.dataSource === 'mock' && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-text-secondary/15 text-text-secondary/60">MOCK</span>
          )}
        </div>
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

      {/* チャート */}
      <div className="h-10">
        <SparklineChart data={item.sparklineData} color={sparkColor} />
      </div>
    </div>
  );
}
