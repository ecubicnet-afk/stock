import type { JournalEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

function migrateEntry(e: JournalEntry): JournalEntry {
  if (e.conditionRating === undefined && (e.healthRating !== undefined || e.mentalRating !== undefined)) {
    const h = e.healthRating ?? 5;
    const m = e.mentalRating ?? 5;
    return {
      ...e,
      conditionRating: Math.round(((h + m) / 2) * 2),
      disciplineRating: e.disciplineRating ?? 5,
      volatilityRating: e.volatilityRating ?? 5,
      fearRating: e.fearRating ?? 5,
      asExpectedRating: e.asExpectedRating ?? 5,
    };
  }
  return {
    ...e,
    conditionRating: e.conditionRating ?? 5,
    disciplineRating: e.disciplineRating ?? 5,
    volatilityRating: e.volatilityRating ?? 5,
    fearRating: e.fearRating ?? 5,
    asExpectedRating: e.asExpectedRating ?? 5,
  };
}

export function useJournal() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('stock-app-journal', []);

  const getEntryByDate = (date: string) => {
    const raw = entries.find((e) => e.date === date);
    return raw ? migrateEntry(raw) : undefined;
  };

  const saveEntry = (date: string, data: Omit<JournalEntry, 'id' | 'date' | 'createdAt' | 'updatedAt' | 'healthRating' | 'mentalRating'>) => {
    const existing = entries.find((e) => e.date === date);
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
        { id: crypto.randomUUID(), date, ...data, createdAt: now, updatedAt: now } as JournalEntry,
      ]);
    }
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, getEntryByDate, saveEntry, deleteEntry };
}
