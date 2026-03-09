import type { ScheduleEvent } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_EVENTS: ScheduleEvent[] = [
  { id: 'default-1', title: '日本GDP速報値', date: '2026-03-10', time: '08:50', importance: 'high' },
  { id: 'default-2', title: '米雇用統計', date: '2026-03-06', time: '22:30', importance: 'high' },
  { id: 'default-3', title: 'FOMC政策声明', date: '2026-03-19', time: '03:00', importance: 'high' },
  { id: 'default-4', title: '日銀金融政策決定会合', date: '2026-03-19', time: '12:00', importance: 'high' },
];

export function useSchedule() {
  const [events, setEvents] = useLocalStorage<ScheduleEvent[]>('stock-app-schedule-v2', DEFAULT_EVENTS);

  const addEvent = (event: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = {
      ...event,
      id: crypto.randomUUID(),
    };
    setEvents((prev) => [...prev, newEvent].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, addEvent, deleteEvent };
}
