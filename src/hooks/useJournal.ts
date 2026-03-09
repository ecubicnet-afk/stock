import type { JournalEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useJournal() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('stock-app-journal', []);

  const getEntryByDate = (date: string) => entries.find((e) => e.date === date);

  const saveEntry = (date: string, data: Omit<JournalEntry, 'id' | 'date' | 'createdAt' | 'updatedAt'>) => {
    const existing = getEntryByDate(date);
    if (existing) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === existing.id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
        )
      );
    } else {
      const now = new Date().toISOString();
      setEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), date, ...data, createdAt: now, updatedAt: now },
      ]);
    }
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, getEntryByDate, saveEntry, deleteEntry };
}
