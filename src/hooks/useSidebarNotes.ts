import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ArchivedTodo {
  id: string;
  text: string;
  completedAt: string;
}

interface TodoState {
  date: string;
  dailyItems: TodoItem[];
  oneshotItems: TodoItem[];
  archive: ArchivedTodo[];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// 旧形式からのマイグレーション
interface LegacyTodoState {
  date: string;
  items: TodoItem[];
}

function migrateLegacy(stored: TodoState | LegacyTodoState): TodoState {
  if ('dailyItems' in stored) return stored as TodoState;
  // 旧形式: { date, items } → 新形式へ変換
  const legacy = stored as LegacyTodoState;
  return {
    date: legacy.date,
    dailyItems: legacy.items || [],
    oneshotItems: [],
    archive: [],
  };
}

export function useSidebarTodos() {
  const [rawState, setState] = useLocalStorage<TodoState>('stock-app-sidebar-todos', {
    date: getToday(),
    dailyItems: [],
    oneshotItems: [],
    archive: [],
  });

  // マイグレーション適用
  const state = migrateLegacy(rawState);

  const today = getToday();

  // 日付が変わった場合: dailyItemsのdoneをリセット、oneshotItemsはそのまま
  const dailyItems = state.date === today
    ? state.dailyItems
    : state.dailyItems.map((item) => ({ ...item, done: false }));

  const oneshotItems = state.oneshotItems;
  const archive = state.archive;

  const updateState = useCallback((updater: (prev: TodoState) => TodoState) => {
    setState((prev) => {
      const migrated = migrateLegacy(prev);
      const currentToday = getToday();
      // 日付チェック: dailyは自動リセット
      const base: TodoState = migrated.date === currentToday
        ? migrated
        : {
          ...migrated,
          date: currentToday,
          dailyItems: migrated.dailyItems.map((item) => ({ ...item, done: false })),
        };
      return updater(base);
    });
  }, [setState]);

  // 毎日タスク操作
  const addDailyTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    updateState((prev) => ({
      ...prev,
      date: getToday(),
      dailyItems: [...prev.dailyItems, { id: Date.now().toString(), text: text.trim(), done: false }],
    }));
  }, [updateState]);

  const toggleDailyTodo = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      date: getToday(),
      dailyItems: prev.dailyItems.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, [updateState]);

  const deleteDailyTodo = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      date: getToday(),
      dailyItems: prev.dailyItems.filter((t) => t.id !== id),
    }));
  }, [updateState]);

  // 一度きりタスク操作
  const addOneshotTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    updateState((prev) => ({
      ...prev,
      date: getToday(),
      oneshotItems: [...prev.oneshotItems, { id: Date.now().toString(), text: text.trim(), done: false }],
    }));
  }, [updateState]);

  const toggleOneshotTodo = useCallback((id: string) => {
    updateState((prev) => {
      const item = prev.oneshotItems.find((t) => t.id === id);
      if (!item) return prev;

      if (!item.done) {
        // チェックした → アーカイブへ移動
        return {
          ...prev,
          date: getToday(),
          oneshotItems: prev.oneshotItems.filter((t) => t.id !== id),
          archive: [
            { id: item.id, text: item.text, completedAt: new Date().toISOString() },
            ...prev.archive,
          ],
        };
      }
      // uncheckはoneshotでは通常起きないが念のため
      return {
        ...prev,
        date: getToday(),
        oneshotItems: prev.oneshotItems.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      };
    });
  }, [updateState]);

  const deleteOneshotTodo = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      date: getToday(),
      oneshotItems: prev.oneshotItems.filter((t) => t.id !== id),
    }));
  }, [updateState]);

  // アーカイブから削除
  const deleteArchiveItem = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      archive: prev.archive.filter((a) => a.id !== id),
    }));
  }, [updateState]);

  return {
    dailyItems,
    oneshotItems,
    archive,
    addDailyTodo,
    toggleDailyTodo,
    deleteDailyTodo,
    addOneshotTodo,
    toggleOneshotTodo,
    deleteOneshotTodo,
    deleteArchiveItem,
  };
}

export function useSidebarPrinciples() {
  const [principles, setPrinciples] = useLocalStorage<string>('stock-app-sidebar-principles', '');
  return { principles, setPrinciples };
}
