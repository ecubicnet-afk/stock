interface MarketSession {
  open: string; // HH:MM
  close: string;
}

interface MarketSchedule {
  timezone: string;
  sessions: MarketSession[];
}

const MARKET_SCHEDULES: Record<string, MarketSchedule> = {
  japan: {
    timezone: 'Asia/Tokyo',
    sessions: [
      { open: '09:00', close: '11:30' },
      { open: '12:30', close: '15:30' },
    ],
  },
  us: {
    timezone: 'America/New_York',
    sessions: [{ open: '09:30', close: '16:00' }],
  },
  forex: {
    // 月〜金 ほぼ24時間（日曜17:00 EST〜金曜17:00 EST）
    timezone: 'America/New_York',
    sessions: [{ open: '00:00', close: '23:59' }],
  },
  commodity_us: {
    timezone: 'America/New_York',
    sessions: [{ open: '09:30', close: '16:00' }],
  },
};

// ID → 市場スケジュール
const ID_TO_MARKET: Record<string, string> = {
  nikkei225: 'japan',
  'nikkei-futures': 'japan',
  topix: 'japan',
  djia: 'us',
  nasdaq100: 'us',
  sp500: 'us',
  usdjpy: 'forex',
  eurjpy: 'forex',
  gbpjpy: 'forex',
  eurusd: 'forex',
  audjpy: 'forex',
  wti: 'commodity_us',
  gold: 'commodity_us',
};

function getLocalTime(timezone: string): { hours: number; minutes: number; dayOfWeek: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hours = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[weekdayStr] ?? 0;
  return { hours, minutes, dayOfWeek };
}

function isInSession(hours: number, minutes: number, session: MarketSession): boolean {
  const [openH, openM] = session.open.split(':').map(Number);
  const [closeH, closeM] = session.close.split(':').map(Number);
  const current = hours * 60 + minutes;
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current < close;
}

export function isMarketOpen(itemId: string): boolean {
  const marketKey = ID_TO_MARKET[itemId];
  if (!marketKey) return false;
  const schedule = MARKET_SCHEDULES[marketKey];
  if (!schedule) return false;

  const { hours, minutes, dayOfWeek } = getLocalTime(schedule.timezone);

  // 土日は閉場（forexも土日は閉場）
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  return schedule.sessions.some((s) => isInSession(hours, minutes, s));
}
