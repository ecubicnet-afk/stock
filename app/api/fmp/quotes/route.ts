import { NextRequest, NextResponse } from 'next/server';

const FMP_BASE = 'https://financialmodelingprep.com/stable';

export async function GET(request: NextRequest) {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP API key not configured' }, { status: 500 });
  }

  const symbols = request.nextUrl.searchParams.get('symbols');
  if (!symbols) {
    return NextResponse.json({ error: 'symbols parameter required' }, { status: 400 });
  }

  // Validate symbols format (alphanumeric, ^, comma, period)
  if (!/^[\w^.,%-]+$/.test(symbols)) {
    return NextResponse.json({ error: 'Invalid symbols format' }, { status: 400 });
  }

  try {
    const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({ error: `FMP API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch FMP data' }, { status: 500 });
  }
}
