'use client';
import { useState, useEffect } from 'react';
import type { MarketStatus } from '../types';
import { MARKET_HOURS } from '../utils/constants';

function getHourInTimezone(date: Date, timezone: string): number {
  const timeStr = date.toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

function getDayInTimezone(date: Date, timezone: string): number {
  const dayStr = date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'narrow',
  });
  const dayMap: Record<string, number> = { S: 0, M: 1, T: 2, W: 3, F: 5 };
  // 火曜と木曜の区別
  const fullDay = date.toLocaleString('en-US', { timeZone: timezone, weekday: 'long' });
  if (fullDay === 'Thursday') return 4;
  if (fullDay === 'Tuesday') return 2;
  return dayMap[dayStr] ?? 1;
}

function getMarketStatuses(now: Date): MarketStatus[] {
  return Object.entries(MARKET_HOURS).map(([, config]) => {
    const hour = getHourInTimezone(now, config.timezone);
    const day = getDayInTimezone(now, config.timezone);
    const isWeekday = day >= 1 && day <= 5;
    const isOpen = isWeekday && hour >= config.open && hour < config.close;

    let nextEvent = '';
    if (!isWeekday) {
      nextEvent = '休場';
    } else if (isOpen) {
      const remaining = config.close - hour;
      const hours = Math.floor(remaining);
      const mins = Math.round((remaining - hours) * 60);
      nextEvent = `閉場まで${hours}時間${mins}分`;
    } else if (hour < config.open) {
      const until = config.open - hour;
      const hours = Math.floor(until);
      const mins = Math.round((until - hours) * 60);
      nextEvent = `開場まで${hours}時間${mins}分`;
    } else {
      nextEvent = '閉場';
    }

    return { market: config.name, isOpen, nextEvent };
  });
}

export function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const date = now.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const marketStatuses = getMarketStatuses(now);

  return { time, date, marketStatuses };
}
