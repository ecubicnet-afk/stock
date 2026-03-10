import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AssignmentEntry } from '../types';

export function useAssignments() {
  const [assignments, setAssignments] = useLocalStorage<AssignmentEntry[]>('stock-app-assignments', []);

  const addAssignment = useCallback((title: string, content: string) => {
    const now = new Date().toISOString();
    const entry: AssignmentEntry = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };
    setAssignments((prev) => [entry, ...prev]);
  }, [setAssignments]);

  const updateAssignment = useCallback((id: string, updates: Partial<AssignmentEntry>) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    );
  }, [setAssignments]);

  const deleteAssignment = useCallback((id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, [setAssignments]);

  return { assignments, addAssignment, updateAssignment, deleteAssignment };
}
