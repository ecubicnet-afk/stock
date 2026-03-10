import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export function useSidebarTodos() {
  const [todos, setTodos] = useLocalStorage<TodoItem[]>('stock-app-sidebar-todos', []);

  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    setTodos((prev) => [...prev, { id: Date.now().toString(), text: text.trim(), done: false }]);
  }, [setTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, [setTodos]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, [setTodos]);

  return { todos, addTodo, toggleTodo, deleteTodo };
}

export function useSidebarPrinciples() {
  const [principles, setPrinciples] = useLocalStorage<string>('stock-app-sidebar-principles', '');
  return { principles, setPrinciples };
}
