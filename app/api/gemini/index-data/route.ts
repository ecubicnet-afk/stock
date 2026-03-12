import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  let body: { dates: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!Array.isArray(body.dates) || body.dates.length === 0) {
    return NextResponse.json({ error: 'dates array is required' }, { status: 400 });
  }

  if (body.dates.length > 365) {
    return NextResponse.json({ error: 'Too many dates (max 365)' }, { status: 400 });
  }

  const prompt = `以下の日付リストの日経平均株価(N225)とTOPIX終値をJSON形式で教えて。土日祝の場合は直前の営業日を採用して。{ "data": [ { "date": "2026-02-26", "n225": 39500.25, "topix": 2700.50 }, ... ] } リスト: ${body.dates.join(', ')}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Gemini API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch index data' },
      { status: 500 }
    );
  }
}
