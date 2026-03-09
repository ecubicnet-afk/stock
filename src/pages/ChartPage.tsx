import { useState } from 'react';
import { CandlestickChart } from '../components/chart/CandlestickChart';
import { mockOHLCData, chartSymbols } from '../services/mockData';

export function ChartPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('nikkei225');
  const data = mockOHLCData[selectedSymbol] || [];

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

      {/* Chart */}
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-text-primary font-medium">
              {chartSymbols.find((s) => s.id === selectedSymbol)?.nameJa}
            </span>
            <span className="text-text-secondary text-xs ml-2">
              日足 / 60日間
            </span>
          </div>
          {data.length > 0 && (
            <div className="text-right">
              <span className="text-text-primary font-mono text-lg">
                {data[data.length - 1].close.toLocaleString()}
              </span>
              {data.length >= 2 && (() => {
                const change = data[data.length - 1].close - data[data.length - 2].close;
                const pct = (change / data[data.length - 2].close) * 100;
                const isUp = change >= 0;
                return (
                  <span className={`ml-2 text-sm font-mono ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{pct.toFixed(2)}%)
                  </span>
                );
              })()}
            </div>
          )}
        </div>
        <CandlestickChart data={data} />
      </div>
    </div>
  );
}
