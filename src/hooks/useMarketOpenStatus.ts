'use client';
import { useSyncExternalStore } from 'react';
import { isMarketOpen } from '../utils/marketHours';

// Shared tick counter that increments every 60s
let tick = 0;
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!interval) {
    interval = setInterval(() => {
      tick++;
      listeners.forEach((fn) => fn());
    }, 60_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && interval) {
      clearInterval(interval);
      interval = null;
    }
  };
}

function getSnapshot() {
  return tick;
}

/**
 * Shared market open status hook.
 * Uses a single shared interval instead of one per component.
 */
export function useMarketOpenStatus(marketId: string): boolean {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return isMarketOpen(marketId);
}
