import type { MarketItem } from '../../types';

const PAIRS: Array<{ id: string; from: string; to: string; name: string; nameJa: string; currency: string }> = [
  { id: 'usdjpy', from: 'USD', to: 'JPY', name: 'USD/JPY', nameJa: 'ドル円', currency: 'JPY' },
  { id: 'eurjpy', from: 'EUR', to: 'JPY', name: 'EUR/JPY', nameJa: 'ユーロ円', currency: 'JPY' },
  { id: 'gbpjpy', from: 'GBP', to: 'JPY', name: 'GBP/JPY', nameJa: 'ポンド円', currency: 'JPY' },
  { id: 'eurusd', from: 'EUR', to: 'USD', name: 'EUR/USD', nameJa: 'ユーロドル', currency: 'USD' },
  { id: 'audjpy', from: 'AUD', to: 'JPY', name: 'AUD/JPY', nameJa: '豪ドル円', currency: 'JPY' },
];

export async function fetchForexData(): Promise<MarketItem[]> {
  const targets = [...new Set(PAIRS.map((p) => p.to))].join(',');
  const bases = [...new Set(PAIRS.map((p) => p.from))];

  const results: Record<string, Record<string, number>> = {};
  await Promise.all(
    bases.map(async (base) => {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${targets}`);
      if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
      const data = await res.json();
      results[base] = data.rates;
    })
  );

  return PAIRS.map((pair) => {
    const rate = results[pair.from]?.[pair.to] ?? 0;
    return {
      id: pair.id,
      name: pair.name,
      nameJa: pair.nameJa,
      category: 'forex' as const,
      currentValue: rate,
      previousClose: rate,
      change: 0,
      changePercent: 0,
      sparklineData: [],
      currency: pair.currency,
      lastUpdated: new Date().toISOString(),
      dataSource: 'live' as const,
    };
  });
}
