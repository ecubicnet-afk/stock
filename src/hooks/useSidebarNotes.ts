import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface TodoState {
  date: string;
  items: TodoItem[];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function useSidebarTodos() {
  const [state, setState] = useLocalStorage<TodoState>('stock-app-sidebar-todos', { date: getToday(), items: [] });

  // 日付が変わっていたらリセット
  const today = getToday();
  const todos = state.date === today ? state.items : [];

  const setItems = useCallback((updater: (prev: TodoItem[]) => TodoItem[]) => {
    setState((prev) => {
      const currentItems = prev.date === getToday() ? prev.items : [];
      return { date: getToday(), items: updater(currentItems) };
    });
  }, [setState]);

  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    setItems((prev) => [...prev, { id: Date.now().toString(), text: text.trim(), done: false }]);
  }, [setItems]);

  const toggleTodo = useCallback((id: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, [setItems]);

  const deleteTodo = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, [setItems]);

  return { todos, addTodo, toggleTodo, deleteTodo };
}

export function useSidebarPrinciples() {
  const [principles, setPrinciples] = useLocalStorage<string>('stock-app-sidebar-principles', '');
  return { principles, setPrinciples };
}
