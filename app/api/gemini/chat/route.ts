import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'] as const;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  let body: { prompt: string; maxTokens?: number; temperature?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  // Limit prompt size
  if (body.prompt.length > 50000) {
    return NextResponse.json({ error: 'Prompt too large' }, { status: 400 });
  }

  const maxTokens = body.maxTokens ?? 2048;
  const temperature = body.temperature ?? 0.3;

  let lastError: string | null = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: body.prompt }] }],
              generationConfig: { temperature, maxOutputTokens: maxTokens },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 502 });
          }
          return NextResponse.json({
            text: text.replace(/```html?\n?/g, '').replace(/```\n?/g, '').trim(),
          });
        }

        if (res.status === 429 || res.status === 503) {
          lastError = `Gemini API ${res.status}`;
          continue;
        }

        return NextResponse.json({ error: `Gemini API error: ${res.status}` }, { status: res.status });
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
      }
    }
  }

  return NextResponse.json(
    { error: lastError || 'APIレート制限中です。しばらく待ってから再度お試しください。' },
    { status: 429 }
  );
}
