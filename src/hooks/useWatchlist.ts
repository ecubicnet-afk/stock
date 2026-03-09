import type { WatchlistItem, ScheduleEvent } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useWatchlist() {
  const [items, setItems] = useLocalStorage<WatchlistItem[]>('stock-app-watchlist', []);

  const addItem = (data: { ticker: string; tickerName: string; market: WatchlistItem['market'] }) => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...data,
        notes: '',
        events: [],
        tags: [],
        addedAt: new Date().toISOString(),
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  const addEvent = (id: string, event: Omit<ScheduleEvent, 'id'>) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, events: [...i.events, { ...event, id: crypto.randomUUID() }] }
          : i
      )
    );
  };

  const removeEvent = (itemId: string, eventId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, events: i.events.filter((e) => e.id !== eventId) }
          : i
      )
    );
  };

  // Update event by eventId only (searches across all items)
  const updateEventById = (eventId: string, updates: Partial<Omit<ScheduleEvent, 'id'>>) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        events: item.events.map((e) =>
          e.id === eventId ? { ...e, ...updates } : e
        ),
      }))
    );
  };

  // Remove event by eventId only (searches across all items)
  const removeEventById = (eventId: string) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        events: item.events.filter((e) => e.id !== eventId),
      }))
    );
  };

  const updateTags = (id: string, tags: string[]) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, tags } : i)));
  };

  return { items, addItem, removeItem, updateNotes, addEvent, removeEvent, updateEventById, removeEventById, updateTags };
}
