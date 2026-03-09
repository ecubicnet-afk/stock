import type { ScheduleEvent } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_ECONOMIC_EVENTS } from '../data/economicEvents';

export function useSchedule() {
  const [events, setEvents] = useLocalStorage<ScheduleEvent[]>('stock-app-schedule-v5', DEFAULT_ECONOMIC_EVENTS);

  const addEvent = (event: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = {
      ...event,
      id: crypto.randomUUID(),
    };
    setEvents((prev) => [...prev, newEvent].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
  };

  const updateEvent = (id: string, updates: Partial<Omit<ScheduleEvent, 'id'>>) => {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...updates } : e))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, addEvent, updateEvent, deleteEvent };
}
