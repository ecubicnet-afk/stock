import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { TradeMethodEntry } from '../types';

export function useTradeMethods() {
  const [methods, setMethods] = useLocalStorage<TradeMethodEntry[]>('stock-app-trade-methods', []);

  const addMethod = useCallback((title: string, content: string, tags: string[] = []) => {
    const now = new Date().toISOString();
    const entry: TradeMethodEntry = {
      id: crypto.randomUUID(),
      title,
      content,
      tags,
      createdAt: now,
      updatedAt: now,
    };
    setMethods((prev) => [entry, ...prev]);
  }, [setMethods]);

  const updateMethod = useCallback((id: string, updates: Partial<TradeMethodEntry>) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m))
    );
  }, [setMethods]);

  const deleteMethod = useCallback((id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  }, [setMethods]);

  return { methods, addMethod, updateMethod, deleteMethod };
}
