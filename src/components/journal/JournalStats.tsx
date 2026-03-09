interface Props {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
}

export function JournalStats({ totalTrades, winRate, totalPnl, averagePnl }: Props) {
  const stats = [
    { label: '総トレード数', value: totalTrades.toString() },
    { label: '勝率', value: totalTrades > 0 ? `${winRate.toFixed(1)}%` : '-' },
    { label: '累計損益', value: totalPnl !== 0 ? `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}` : '-', color: totalPnl >= 0 ? 'text-up' : 'text-down' },
    { label: '平均損益', value: averagePnl !== 0 ? `${averagePnl >= 0 ? '+' : ''}${averagePnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-', color: averagePnl >= 0 ? 'text-up' : 'text-down' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl px-3 py-2 text-center">
          <div className="text-xs text-text-secondary">{s.label}</div>
          <div className={`text-lg font-mono font-bold ${s.color ?? 'text-text-primary'}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
