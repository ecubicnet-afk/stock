'use client';

import { useState, useCallback, useRef } from 'react';
import { useSettings } from './useSettings';
import type {
  StrategyData,
  MemoEntry,
  ScheduleEvent,
  JournalEntry,
  TradeRecord,
  NotionDataType,
  NotionDatabaseIds,
  NotionExportMap,
} from '../types';
import type { HoldingItem } from './usePortfolio';
import {
  testNotionConnection,
  ensureNotionDatabases,
  exportStrategies,
  exportMemos,
  exportSchedule,
  exportJournal,
  exportTrades,
  exportPortfolio,
  type ExportResult,
  type ExportProgress,
} from '../services/notionExport';

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

const DB_IDS_KEY = 'stock-app-notion-db-ids';
const EXPORT_MAP_KEY = 'stock-app-notion-export-map';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const EMPTY_EXPORT_MAP: NotionExportMap = {
  strategies: {},
  memos: {},
  schedule: {},
  journal: {},
  trades: {},
  portfolio: {},
};

// ---------------------------------------------------------------------------
// All data sources passed by the caller
// ---------------------------------------------------------------------------

export interface AllDataSources {
  strategies: StrategyData;
  memos: MemoEntry[];
  schedule: ScheduleEvent[];
  journal: JournalEntry[];
  trades: TradeRecord[];
  holdings: Record<string, HoldingItem[]>;
}

export interface ExportTypeResult {
  type: NotionDataType;
  result: ExportResult;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotionExport() {
  const { settings } = useSettings();

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [lastExportResults, setLastExportResults] = useState<ExportTypeResult[] | null>(null);
  const cancelRef = useRef(false);

  const isConfigured = !!(settings.notionApiKey && settings.notionParentPageId);

  const handleTestConnection = useCallback(async () => {
    if (!settings.notionApiKey) {
      return { success: false, error: 'Notion APIキーが設定されていません' };
    }
    return testNotionConnection(settings.notionApiKey);
  }, [settings.notionApiKey]);

  const exportAll = useCallback(async (data: AllDataSources) => {
    if (!settings.notionApiKey || !settings.notionParentPageId) return;

    setIsExporting(true);
    setLastExportResults(null);
    cancelRef.current = false;

    const results: ExportTypeResult[] = [];
    let dbIds = loadJson<NotionDatabaseIds>(DB_IDS_KEY, {});
    let exportMap = loadJson<NotionExportMap>(EXPORT_MAP_KEY, EMPTY_EXPORT_MAP);

    try {
      // Step 1: Ensure databases exist
      setExportProgress({ current: 0, total: 1, currentType: 'strategies', label: 'データベースを作成中...' });
      dbIds = await ensureNotionDatabases(settings.notionApiKey, settings.notionParentPageId, dbIds);
      saveJson(DB_IDS_KEY, dbIds);

      if (cancelRef.current) return;

      // Step 2: Export each type
      const exportTasks: Array<{
        type: NotionDataType;
        fn: () => Promise<ExportResult>;
      }> = [];

      if (dbIds.strategies && data.strategies?.scenarios?.length) {
        exportTasks.push({
          type: 'strategies',
          fn: () => exportStrategies(settings.notionApiKey, dbIds.strategies!, data.strategies, exportMap.strategies, setExportProgress),
        });
      }
      if (dbIds.memos && data.memos?.length) {
        exportTasks.push({
          type: 'memos',
          fn: () => exportMemos(settings.notionApiKey, dbIds.memos!, data.memos, exportMap.memos, setExportProgress),
        });
      }
      if (dbIds.schedule && data.schedule?.length) {
        exportTasks.push({
          type: 'schedule',
          fn: () => exportSchedule(settings.notionApiKey, dbIds.schedule!, data.schedule, exportMap.schedule, setExportProgress),
        });
      }
      if (dbIds.journal && data.journal?.length) {
        exportTasks.push({
          type: 'journal',
          fn: () => exportJournal(settings.notionApiKey, dbIds.journal!, data.journal, exportMap.journal, setExportProgress),
        });
      }
      if (dbIds.trades && data.trades?.length) {
        exportTasks.push({
          type: 'trades',
          fn: () => exportTrades(settings.notionApiKey, dbIds.trades!, data.trades, exportMap.trades, setExportProgress),
        });
      }
      if (dbIds.portfolio && data.holdings) {
        const allHoldings = Object.entries(data.holdings).flatMap(([key, items]) =>
          items.map((item) => ({ item, accountType: key }))
        );
        if (allHoldings.length > 0) {
          exportTasks.push({
            type: 'portfolio',
            fn: async () => {
              let combinedResult: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap.portfolio } };
              for (const [key, items] of Object.entries(data.holdings)) {
                if (items.length === 0) continue;
                const res = await exportPortfolio(settings.notionApiKey, dbIds.portfolio!, items, key, combinedResult.updatedExportMap, setExportProgress);
                combinedResult = {
                  created: combinedResult.created + res.created,
                  updated: combinedResult.updated + res.updated,
                  skipped: combinedResult.skipped + res.skipped,
                  errors: [...combinedResult.errors, ...res.errors],
                  updatedExportMap: res.updatedExportMap,
                };
              }
              return combinedResult;
            },
          });
        }
      }

      for (const task of exportTasks) {
        if (cancelRef.current) break;
        const result = await task.fn();
        exportMap = {
          ...exportMap,
          [task.type]: result.updatedExportMap,
        };
        saveJson(EXPORT_MAP_KEY, exportMap);
        results.push({ type: task.type, result });
      }

      setLastExportResults(results);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      results.push({
        type: 'strategies',
        result: { created: 0, updated: 0, skipped: 0, errors: [errMsg], updatedExportMap: {} },
      });
      setLastExportResults(results);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [settings.notionApiKey, settings.notionParentPageId]);

  const cancelExport = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const resetExportHistory = useCallback(() => {
    localStorage.removeItem(EXPORT_MAP_KEY);
    localStorage.removeItem(DB_IDS_KEY);
    setLastExportResults(null);
  }, []);

  return {
    isConfigured,
    isExporting,
    exportProgress,
    lastExportResults,
    testConnection: handleTestConnection,
    exportAll,
    cancelExport,
    resetExportHistory,
  };
}
