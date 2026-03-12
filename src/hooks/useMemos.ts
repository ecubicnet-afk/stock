'use client';
import type { MemoEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useMemos() {
  const [memos, setMemos] = useLocalStorage<MemoEntry[]>('stock-app-memos', []);

  const addMemo = (text: string, images?: string[]) => {
    const now = new Date().toISOString();
    const entry: MemoEntry = {
      id: crypto.randomUUID(),
      text,
      images: images?.length ? images : undefined,
      createdAt: now,
      updatedAt: now,
    };
    setMemos((prev) => [entry, ...prev]);
  };

  const updateMemo = (id: string, text: string, images?: string[]) => {
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, text, images: images?.length ? images : undefined, updatedAt: new Date().toISOString() } : m
      )
    );
  };

  const deleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  };

  return { memos, addMemo, updateMemo, deleteMemo };
}
