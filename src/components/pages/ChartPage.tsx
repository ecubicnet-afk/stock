'use client';
import { useState } from 'react';
import { TradingViewWidget } from '@/src/components/chart/TradingViewWidget';
import { chartSymbols } from '@/src/services/mockData';

export function ChartPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('nikkei225');
  const selected = chartSymbols.find((s) => s.id === selectedSymbol);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">
          ローソク足チャート
        </h1>
      </div>

      {/* Symbol tabs */}
      <div className="flex gap-2">
        {chartSymbols.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSymbol(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSymbol === s.id
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                : 'bg-bg-card text-text-secondary border border-border hover:text-text-primary hover:border-border'
            }`}
          >
            {s.nameJa}
          </button>
        ))}
      </div>

      {/* TradingView Chart */}
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
        {selected && (
          <TradingViewWidget key={selected.id} symbol={selected.tvSymbol} height={500} />
        )}
      </div>
    </div>
  );
}
