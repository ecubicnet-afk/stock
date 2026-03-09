import type { TradeRecord } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useMemo } from 'react';

export function useTrades() {
  const [trades, setTrades] = useLocalStorage<TradeRecord[]>('stock-app-trades', []);

  const addTrade = (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => {
    setTrades((prev) => [
      ...prev,
      { ...trade, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]);
  };

  const updateTrade = (id: string, data: Partial<TradeRecord>) => {
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const getTradesByDate = (date: string) => trades.filter((t) => t.date === date);
  const getTradesByTicker = (ticker: string) => trades.filter((t) => t.ticker === ticker);

  const stats = useMemo(() => {
    const sells = trades.filter((t) => t.side === 'sell' && t.pnl !== undefined);
    const wins = sells.filter((t) => (t.pnl ?? 0) > 0);
    const totalPnl = sells.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    return {
      totalTrades: trades.length,
      winRate: sells.length > 0 ? (wins.length / sells.length) * 100 : 0,
      totalPnl,
      averagePnl: sells.length > 0 ? totalPnl / sells.length : 0,
    };
  }, [trades]);

  return { trades, addTrade, updateTrade, deleteTrade, getTradesByDate, getTradesByTicker, stats };
}
