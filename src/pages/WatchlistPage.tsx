import { useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useTrades } from '../hooks/useTrades';
import { LinkifiedText } from '../components/common/LinkifiedText';
import type { WatchlistItem, ScheduleEvent } from '../types';

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${dt.getMonth() + 1}/${dt.getDate()} (${days[dt.getDay()]})`;
}

const IMPORTANCE_DOT: Record<ScheduleEvent['importance'], string> = {
  high: 'bg-down',
  medium: 'bg-accent-gold',
  low: 'bg-accent-cyan',
  scenario: 'bg-violet-400',
};

export function WatchlistPage() {
  const { items, addItem, removeItem, updateNotes, addEvent, removeEvent } = useWatchlist();
  const { getTradesByTicker } = useTrades();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newMarket, setNewMarket] = useState<WatchlistItem['market']>('JP');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventImportance, setEventImportance] = useState<ScheduleEvent['importance']>('medium');

  const handleAdd = () => {
    if (!newTicker.trim()) return;
    addItem({ ticker: newTicker.trim(), tickerName: newName.trim() || newTicker.trim(), market: newMarket });
    setNewTicker('');
    setNewName('');
    setShowAddForm(false);
  };

  const handleAddEvent = (itemId: string) => {
    if (!eventTitle.trim() || !eventDate) return;
    addEvent(itemId, { title: eventTitle.trim(), date: eventDate, time: '00:00', importance: eventImportance });
    setEventTitle('');
    setEventDate('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">ウォッチリスト</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30"
        >
          + 銘柄追加
        </button>
      </div>

      {showAddForm && (
        <div className="bg-bg-card/70 border border-border rounded-xl p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} placeholder="銘柄コード (例: 7203)" className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan/50" />
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="銘柄名 (例: トヨタ)" className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan/50" />
            <select value={newMarket} onChange={(e) => setNewMarket(e.target.value as WatchlistItem['market'])} className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary [color-scheme:dark]">
              <option value="JP">日本株</option>
              <option value="US">米国株</option>
              <option value="other">その他</option>
            </select>
            <button onClick={handleAdd} disabled={!newTicker.trim()} className="px-4 py-2 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 disabled:opacity-40">追加</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAddForm && (
        <div className="text-center py-16">
          <p className="text-text-secondary/60 text-sm">ウォッチリストに銘柄を追加してください</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const tickerTrades = getTradesByTicker(item.ticker);
          return (
            <div key={item.id} className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-primary/30"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <span className="text-xs px-1.5 py-0.5 rounded bg-bg-primary text-text-secondary">{item.market}</span>
                <span className="font-mono text-sm font-semibold text-text-primary">{item.ticker}</span>
                <span className="text-sm text-text-secondary">{item.tickerName}</span>
                {item.tags.length > 0 && (
                  <div className="flex gap-1 ml-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-accent-cyan/10 text-accent-cyan px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-text-secondary/60">
                    {item.events.length > 0 && `${item.events.length}件の予定`}
                    {item.events.length > 0 && tickerTrades.length > 0 && ' / '}
                    {tickerTrades.length > 0 && `${tickerTrades.length}件のトレード`}
                  </span>
                  <svg className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Notes */}
                    <div>
                      <h4 className="text-xs font-semibold text-text-secondary mb-1">メモ</h4>
                      {editingNotesId === item.id ? (
                        <div>
                          <textarea
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            className="w-full h-20 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => { updateNotes(item.id, notesDraft); setEditingNotesId(null); }} className="text-xs text-accent-cyan">保存</button>
                            <button onClick={() => setEditingNotesId(null)} className="text-xs text-text-secondary">キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => { setEditingNotesId(item.id); setNotesDraft(item.notes); }}
                          className="min-h-[3rem] bg-bg-primary/30 rounded-lg p-2 text-sm text-text-primary cursor-text"
                        >
                          {item.notes ? <span className="whitespace-pre-wrap"><LinkifiedText text={item.notes} /></span> : <span className="text-text-secondary/50">クリックしてメモを追加...</span>}
                        </div>
                      )}
                    </div>

                    {/* Events */}
                    <div>
                      <h4 className="text-xs font-semibold text-text-secondary mb-1">予定</h4>
                      <div className="space-y-1 mb-2">
                        {item.events.length === 0 && <p className="text-xs text-text-secondary/50">予定なし</p>}
                        {item.events.sort((a, b) => a.date.localeCompare(b.date)).map((ev) => (
                          <div key={ev.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${IMPORTANCE_DOT[ev.importance]}`} />
                            <span className="text-text-secondary font-mono">{formatDate(ev.date)}</span>
                            <span className="text-text-primary">{ev.title}</span>
                            <button onClick={() => removeEvent(item.id, ev.id)} className="text-text-secondary/40 hover:text-down ml-auto">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="予定名" className="flex-1 bg-bg-primary/50 border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none" />
                        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="bg-bg-primary/50 border border-border rounded px-2 py-1 text-xs text-text-primary [color-scheme:dark]" />
                        <select value={eventImportance} onChange={(e) => setEventImportance(e.target.value as ScheduleEvent['importance'])} className="bg-bg-primary/50 border border-border rounded px-1 py-1 text-xs text-text-primary [color-scheme:dark]">
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                          <option value="scenario">シナリオ</option>
                        </select>
                        <button onClick={() => handleAddEvent(item.id)} className="text-xs text-accent-gold hover:text-accent-gold/80 px-2">追加</button>
                      </div>
                    </div>
                  </div>

                  {/* Trade history */}
                  {tickerTrades.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-text-secondary mb-1">トレード履歴</h4>
                      <div className="space-y-1">
                        {tickerTrades.slice(0, 10).map((t) => (
                          <div key={t.id} className="flex items-center gap-2 text-xs bg-bg-primary/30 rounded px-2 py-1.5">
                            <span className="font-mono text-text-secondary">{t.date}</span>
                            <span className={`font-bold ${t.side === 'buy' ? 'text-up' : 'text-down'}`}>{t.side === 'buy' ? '買' : '売'}</span>
                            <span className="text-text-primary font-mono">{t.quantity.toLocaleString()}</span>
                            <span className="text-text-secondary">@</span>
                            <span className="text-text-primary font-mono">{t.price.toLocaleString()}</span>
                            {t.pnl !== undefined && (
                              <span className={`ml-auto font-mono ${t.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                                {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button onClick={() => removeItem(item.id)} className="text-xs text-down/60 hover:text-down">この銘柄を削除</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
