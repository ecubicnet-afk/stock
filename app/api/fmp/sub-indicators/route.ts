import { NextResponse } from 'next/server';

const FMP_BASE = 'https://financialmodelingprep.com/stable';

export async function GET() {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP API key not configured' }, { status: 500 });
  }

  try {
    const symbols = '^VIX,^TNX';
    const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({ error: `FMP API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sub-indicators' }, { status: 500 });
  }
}
