import { NextRequest, NextResponse } from 'next/server';

const FMP_BASE = 'https://financialmodelingprep.com/stable';

export async function GET(request: NextRequest) {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP API key not configured' }, { status: 500 });
  }

  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol || !/^[\w^.%-]+$/.test(symbol)) {
    return NextResponse.json({ error: 'Valid symbol parameter required' }, { status: 400 });
  }

  try {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const url = `${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json({ error: `FMP API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}
