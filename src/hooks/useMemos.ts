import type { MemoEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useMemos() {
  const [memos, setMemos] = useLocalStorage<MemoEntry[]>('stock-app-memos', []);

  const addMemo = (text: string) => {
    const now = new Date().toISOString();
    const entry: MemoEntry = {
      id: crypto.randomUUID(),
      text,
      createdAt: now,
      updatedAt: now,
    };
    setMemos((prev) => [entry, ...prev]);
  };

  const updateMemo = (id: string, text: string) => {
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, text, updatedAt: new Date().toISOString() } : m
      )
    );
  };

  const deleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  };

  return { memos, addMemo, updateMemo, deleteMemo };
}
