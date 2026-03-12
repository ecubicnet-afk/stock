'use client';
import type { MarketSummary as MarketSummaryType } from '../../types';

interface MarketSummaryProps {
  data: MarketSummaryType;
}

export function MarketSummary({ data }: MarketSummaryProps) {
  if (!data.text) return null;

  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="shrink-0 text-xs font-semibold text-accent-gold bg-accent-gold/10 px-2 py-1 rounded">
        SUMMARY
      </span>
      <p className="text-sm text-text-primary truncate">
        {data.text}
      </p>
    </div>
  );
}
