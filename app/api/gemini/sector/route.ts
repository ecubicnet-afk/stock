import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  let body: { stockCodes: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!Array.isArray(body.stockCodes) || body.stockCodes.length === 0) {
    return NextResponse.json({ error: 'stockCodes array is required' }, { status: 400 });
  }

  // Limit to prevent abuse
  if (body.stockCodes.length > 100) {
    return NextResponse.json({ error: 'Too many stock codes (max 100)' }, { status: 400 });
  }

  const prompt = `以下の日本株の銘柄コードの「東証33業種」を教えて。JSON形式 { "stocks": [ { "code": "1605", "sector": "鉱業" }, ... ] } で返して。リスト: ${body.stockCodes.join(', ')}`;

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
      { error: err instanceof Error ? err.message : 'Failed to classify sectors' },
      { status: 500 }
    );
  }
}
