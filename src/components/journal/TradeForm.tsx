import { useState, useEffect } from 'react';
import type { TradeRecord } from '../../types';
import { ImageAttachment } from '../common/ImageAttachment';

interface PrefillData {
  date?: string;
  ticker?: string;
  tickerName?: string;
  side?: 'buy' | 'sell';
  pnl?: number;
}

interface Props {
  date: string;
  prefill?: PrefillData;
  onAdd: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function TradeForm({ date, prefill, onAdd, onCancel }: Props) {
  const [ticker, setTicker] = useState('');
  const [tickerName, setTickerName] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [emotion, setEmotion] = useState('');
  const [pnl, setPnl] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (prefill) {
      if (prefill.ticker) setTicker(prefill.ticker);
      if (prefill.tickerName) setTickerName(prefill.tickerName);
      if (prefill.side) setSide(prefill.side);
      if (prefill.pnl !== undefined) setPnl(String(prefill.pnl));
    }
  }, [prefill]);

  const handleSubmit = () => {
    if (!ticker || !quantity || !price) return;
    const q = Number(quantity);
    const p = Number(price);
    onAdd({
      date,
      ticker,
      tickerName: tickerName || ticker,
      side,
      quantity: q,
      price: p,
      totalAmount: q * p,
      reason,
      emotion,
      pnl: pnl ? Number(pnl) : undefined,
      tags: [],
      images: images.length > 0 ? images : undefined,
    });
  };

  return (
    <div className="bg-bg-primary/50 border border-border rounded-xl p-3 space-y-2">
      {prefill && (
        <div className="text-[11px] text-accent-gold/70 bg-accent-gold/5 px-2 py-1 rounded mb-1">
          CSV取引明細から自動入力されました
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="銘柄コード" className="bg-bg-card/50 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-gold/50" />
        <input type="text" value={tickerName} onChange={(e) => setTickerName(e.target.value)} placeholder="銘柄名" className="bg-bg-card/50 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-gold/50" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button onClick={() => setSide('buy')} className={`flex-1 py-1.5 text-xs font-semibold ${side === 'buy' ? 'bg-up text-white' : 'bg-bg-card/50 text-text-secondary'}`}>買い</button>
          <button onClick={() => setSide('sell')} className={`flex-1 py-1.5 text-xs font-semibold ${side === 'sell' ? 'bg-down text-white' : 'bg-bg-card/50 text-text-secondary'}`}>売り</button>
        </div>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="数量" className="bg-bg-card/50 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-gold/50" />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="価格" className="bg-bg-card/50 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-gold/50" />
      </div>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="理由（エントリー/イグジット理由）" className="w-full h-12 bg-bg-card/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-gold/50" />
      <ImageAttachment images={images} onChange={setImages} maxImages={3} />
      <div className="grid grid-cols-2 gap-2">
        <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="bg-bg-card/50 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary [color-scheme:dark]">
          <option value="">感情状態</option>
          <option value="冷静">冷静</option>
          <option value="自信あり">自信あり</option>
          <option value="不安">不安</option>
          <option value="焦り">焦り</option>
          <option value="恐怖">恐怖</option>
          <option value="興奮">興奮</option>
          <option value="後悔">後悔</option>
        </select>
        {side === 'sell' && (
          <input type="number" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="損益 (P&L)" className="bg-bg-card/50 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-gold/50" />
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!ticker || !quantity || !price} className="px-3 py-1.5 bg-accent-gold/20 text-accent-gold text-xs rounded-lg hover:bg-accent-gold/30 disabled:opacity-40">追加</button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-bg-card text-text-secondary text-xs rounded-lg hover:text-text-primary">キャンセル</button>
      </div>
    </div>
  );
}
