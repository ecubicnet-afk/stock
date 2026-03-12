'use client';
import { useCallback } from 'react';
import type { StrategyData, StrategyNote, StrategyConnection, StrategyNoteRegion, StrategyNoteDirection, PositionSizing, ScenarioDescription, StrategyDrawing } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_STRATEGY: StrategyData = {
  scenarios: [
    { id: 'main', name: '想定シナリオ', type: 'main', notes: [], connections: [], summary: '' },
  ],
  positionSizing: { capital: 1000000, riskPercent: 2, entryPrice: 38000, stopLossPrice: 37500 },
  scenarioDescription: { text: '', urls: [] },
  drawing: { paths: [], texts: [] },
};

export function useStrategy() {
  const [data, setData] = useLocalStorage<StrategyData>('stock-app-strategy', DEFAULT_STRATEGY);

  const updateScenario = useCallback(
    (scenarioId: string, updater: (notes: StrategyNote[], connections: StrategyConnection[]) => { notes: StrategyNote[]; connections: StrategyConnection[] }) => {
      setData((prev) => ({
        ...prev,
        scenarios: prev.scenarios.map((s) => (s.id === scenarioId ? { ...s, ...updater(s.notes, s.connections) } : s)),
      }));
    },
    [setData]
  );

  const addNote = useCallback(
    (scenarioId: string, region: StrategyNoteRegion, direction: StrategyNoteDirection, title: string, description: string, x: number, y: number, url?: string, sourceType?: 'memo' | 'schedule', sourceId?: string, date?: string) => {
      const note: StrategyNote = { id: crypto.randomUUID(), region, direction, title, description, url, date, sourceType, sourceId, x, y };
      updateScenario(scenarioId, (notes, connections) => ({ notes: [...notes, note], connections }));
    },
    [updateScenario]
  );

  const updateNote = useCallback(
    (scenarioId: string, noteId: string, updates: Partial<Omit<StrategyNote, 'id'>>) => {
      updateScenario(scenarioId, (notes, connections) => ({
        notes: notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
        connections,
      }));
    },
    [updateScenario]
  );

  const removeNote = useCallback(
    (scenarioId: string, noteId: string) => {
      updateScenario(scenarioId, (notes, connections) => ({
        notes: notes.filter((n) => n.id !== noteId),
        connections: connections.filter((c) => c.fromId !== noteId && c.toId !== noteId),
      }));
    },
    [updateScenario]
  );

  const addConnection = useCallback(
    (scenarioId: string, fromId: string, toId: string, direction: 'bullish' | 'bearish' | 'neutral', label?: string) => {
      const conn: StrategyConnection = { id: crypto.randomUUID(), fromId, toId, direction, label };
      updateScenario(scenarioId, (notes, connections) => ({ notes, connections: [...connections, conn] }));
    },
    [updateScenario]
  );

  const removeConnection = useCallback(
    (scenarioId: string, connectionId: string) => {
      updateScenario(scenarioId, (notes, connections) => ({
        notes,
        connections: connections.filter((c) => c.id !== connectionId),
      }));
    },
    [updateScenario]
  );

  const updateSummary = useCallback(
    (scenarioId: string, summary: string) => {
      setData((prev) => ({
        ...prev,
        scenarios: prev.scenarios.map((s) => (s.id === scenarioId ? { ...s, summary } : s)),
      }));
    },
    [setData]
  );

  const updatePositionSizing = useCallback(
    (ps: Partial<PositionSizing>) => {
      setData((prev) => ({ ...prev, positionSizing: { ...prev.positionSizing, ...ps } }));
    },
    [setData]
  );

  const updateScenarioDescription = useCallback(
    (updates: Partial<ScenarioDescription>) => {
      setData((prev) => ({
        ...prev,
        scenarioDescription: { ...(prev.scenarioDescription || { text: '', urls: [] }), ...updates },
      }));
    },
    [setData]
  );

  const updateDrawing = useCallback(
    (drawing: StrategyDrawing) => {
      setData((prev) => ({ ...prev, drawing }));
    },
    [setData]
  );

  // Backward compat: ensure scenarioDescription and drawing exist
  const safeData: StrategyData = {
    ...data,
    scenarioDescription: data.scenarioDescription || { text: '', urls: [] },
    drawing: data.drawing || { paths: [], texts: [] },
  };

  return { data: safeData, addNote, updateNote, removeNote, addConnection, removeConnection, updateSummary, updatePositionSizing, updateScenarioDescription, updateDrawing };
}
