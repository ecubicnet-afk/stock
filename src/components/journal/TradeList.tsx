'use client';
import type { TradeRecord } from '../../types';
import { ImageThumbnails } from '../common/ImageAttachment';

interface Props {
  trades: TradeRecord[];
  onDelete: (id: string) => void;
}

export function TradeList({ trades, onDelete }: Props) {
  if (trades.length === 0) {
    return <p className="text-text-secondary/60 text-xs text-center py-4">この日のトレード記録はありません</p>;
  }

  return (
    <div className="space-y-2">
      {trades.map((t) => (
        <div key={t.id} className="bg-bg-primary/50 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.side === 'buy' ? 'bg-up/20 text-up' : 'bg-down/20 text-down'}`}>
                {t.side === 'buy' ? '買' : '売'}
              </span>
              <span className="text-sm font-semibold text-text-primary">{t.ticker}</span>
              <span className="text-xs text-text-secondary">{t.tickerName}</span>
            </div>
            <button onClick={() => onDelete(t.id)} className="text-text-secondary/40 hover:text-down text-xs">削除</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-1">
            <div><span className="text-text-secondary">数量: </span><span className="text-text-primary font-mono">{t.quantity.toLocaleString()}</span></div>
            <div><span className="text-text-secondary">価格: </span><span className="text-text-primary font-mono">{t.price.toLocaleString()}</span></div>
            <div><span className="text-text-secondary">金額: </span><span className="text-text-primary font-mono">{t.totalAmount.toLocaleString()}</span></div>
          </div>
          {t.pnl !== undefined && (
            <div className="text-xs mb-1">
              <span className="text-text-secondary">損益: </span>
              <span className={`font-mono font-bold ${t.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()}
              </span>
            </div>
          )}
          {t.reason && <p className="text-xs text-text-secondary/80 mt-1">{t.reason}</p>}
          {t.emotion && <span className="inline-block text-xs bg-bg-card px-1.5 py-0.5 rounded text-text-secondary mt-1">{t.emotion}</span>}
          <ImageThumbnails images={t.images} />
        </div>
      ))}
    </div>
  );
}
