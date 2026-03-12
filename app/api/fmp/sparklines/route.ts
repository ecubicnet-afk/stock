import { NextResponse } from 'next/server';

const FMP_BASE = 'https://financialmodelingprep.com/stable';

const SYMBOLS = ['^N225', '^TOPX', '^DJI', '^GSPC', '^NDX', 'CLUSD', 'GCUSD'];

export async function GET() {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP API key not configured' }, { status: 500 });
  }

  try {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const results = await Promise.allSettled(
      SYMBOLS.map(async (symbol) => {
        const url = `${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&apikey=${apiKey}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return { symbol, data: [] };
        const json = await res.json();
        const historical = Array.isArray(json) ? json : json?.historical || [];
        return { symbol, data: historical };
      })
    );

    const sparklines: Record<string, { date: string; close: number }[]> = {};
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data.length > 0) {
        sparklines[result.value.symbol] = result.value.data;
      }
    }

    return NextResponse.json(sparklines);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sparkline data' }, { status: 500 });
  }
}
