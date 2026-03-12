'use client';
import type { SubIndicator } from '../../types';
import { formatChange, formatPercent, getChangeColor } from '../../utils/formatters';
import { CATEGORY_LABELS } from '../../utils/constants';

interface SubIndicatorTableProps {
  indicators: SubIndicator[];
}

const CATEGORY_ORDER = ['volatility', 'sentiment', 'trading', 'valuation', 'bonds', 'other'] as const;

export function SubIndicatorTable({ indicators }: SubIndicatorTableProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    items: indicators.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">重要サブ指標</h3>
        {indicators.some((i) => i.dataSource === 'mock') && (
          <span className="text-[10px] text-text-secondary/50">(参考値) = モックデータ (3/9時点)</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-secondary">
              <th className="text-left px-4 py-2 font-medium">指標</th>
              <th className="text-right px-4 py-2 font-medium">値</th>
              <th className="text-right px-4 py-2 font-medium">前日比</th>
              <th className="text-right px-4 py-2 font-medium">前日比%</th>
              <th className="text-center px-4 py-2 font-medium">シグナル</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <GroupRows key={group.category} label={group.label} items={group.items} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({ label, items }: { label: string; items: SubIndicator[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={5}
          className="px-4 py-2 text-xs font-semibold text-accent-cyan bg-accent-cyan/5 border-t border-border"
        >
          {label}
        </td>
      </tr>
      {items.map((item) => {
        const color = getChangeColor(item.change);
        const signalColor =
          item.signal === 'bullish'
            ? 'bg-up'
            : item.signal === 'bearish'
            ? 'bg-down'
            : 'bg-text-secondary';

        return (
          <tr key={item.id} className="border-t border-border/50 hover:bg-bg-secondary/30 transition-colors">
            <td className="px-4 py-2 text-text-primary">
              <div>{item.nameJa}</div>
            </td>
            <td className="px-4 py-2 text-right font-mono text-text-primary">
              {item.value.toLocaleString()}{item.unit && <span className="text-text-secondary text-xs ml-1">{item.unit}</span>}
              {item.dataSource === 'mock' && <span className="text-text-secondary/50 text-[10px] ml-1">(参考値)</span>}
            </td>
            <td className={`px-4 py-2 text-right font-mono ${color}`}>
              {formatChange(item.change)}
            </td>
            <td className={`px-4 py-2 text-right font-mono ${color}`}>
              {formatPercent(item.changePercent)}
            </td>
            <td className="px-4 py-2 text-center">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${signalColor}`} />
            </td>
          </tr>
        );
      })}
    </>
  );
}
