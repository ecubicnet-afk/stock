import type { MarketItem } from '../../types';

const COIN_IDS: Record<string, { name: string; nameJa: string }> = {
  bitcoin: { name: 'Bitcoin', nameJa: 'BTC' },
  ethereum: { name: 'Ethereum', nameJa: 'ETH' },
  ripple: { name: 'XRP', nameJa: 'XRP' },
  solana: { name: 'Solana', nameJa: 'SOL' },
  binancecoin: { name: 'BNB', nameJa: 'BNB' },
};

const ID_MAP: Record<string, string> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  ripple: 'xrp',
  solana: 'sol',
  binancecoin: 'bnb',
};

export async function fetchCryptoData(): Promise<MarketItem[]> {
  const ids = Object.keys(COIN_IDS).join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const data = await res.json();

  return Object.entries(COIN_IDS).map(([coinId, info]) => {
    const price = data[coinId]?.usd ?? 0;
    const changePct = data[coinId]?.usd_24h_change ?? 0;
    const change = price * (changePct / 100);
    return {
      id: ID_MAP[coinId],
      name: info.name,
      nameJa: info.nameJa,
      category: 'crypto' as const,
      currentValue: price,
      previousClose: price - change,
      change,
      changePercent: changePct,
      sparklineData: [],
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      dataSource: 'live' as const,
    };
  });
}
