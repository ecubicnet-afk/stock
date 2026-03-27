import { NextRequest, NextResponse } from 'next/server';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(clientKey?: string): string | null {
  return clientKey || process.env.NOTION_API_KEY || null;
}

async function notionFetch(
  path: string,
  apiKey: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: object
): Promise<Response> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }

    const res = await fetch(`${NOTION_API_BASE}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      if (retryAfter) {
        await delay(parseInt(retryAfter, 10) * 1000);
      }
      continue;
    }

    return res;
  }

  return new Response(JSON.stringify({ message: 'Rate limit exceeded after retries' }), {
    status: 429,
  });
}

type NotionAction =
  | 'testConnection'
  | 'createDatabase'
  | 'createPage'
  | 'updatePage'
  | 'queryDatabase'
  | 'appendBlocks';

interface RequestBody {
  action: NotionAction;
  notionApiKey?: string;
  payload?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { action, notionApiKey: clientKey, payload } = body;

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  const apiKey = getApiKey(clientKey);
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Notion API key not configured. Set it in Settings or as NOTION_API_KEY env var.' },
      { status: 401 }
    );
  }

  try {
    switch (action) {
      case 'testConnection': {
        const res = await notionFetch('/users/me', apiKey);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { success: false, error: (err as Record<string, string>).message || `HTTP ${res.status}` },
            { status: 200 }
          );
        }
        const data = await res.json();
        return NextResponse.json({ success: true, botName: (data as Record<string, string>).name });
      }

      case 'createDatabase': {
        if (!payload) {
          return NextResponse.json({ error: 'payload is required' }, { status: 400 });
        }
        const res = await notionFetch('/databases', apiKey, 'POST', payload);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: (err as Record<string, string>).message || `HTTP ${res.status}` },
            { status: res.status }
          );
        }
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'createPage': {
        if (!payload) {
          return NextResponse.json({ error: 'payload is required' }, { status: 400 });
        }
        const res = await notionFetch('/pages', apiKey, 'POST', payload);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: (err as Record<string, string>).message || `HTTP ${res.status}` },
            { status: res.status }
          );
        }
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'updatePage': {
        if (!payload || !payload.pageId) {
          return NextResponse.json({ error: 'payload.pageId is required' }, { status: 400 });
        }
        const { pageId, ...rest } = payload;
        const res = await notionFetch(`/pages/${pageId}`, apiKey, 'PATCH', rest);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: (err as Record<string, string>).message || `HTTP ${res.status}` },
            { status: res.status }
          );
        }
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'queryDatabase': {
        if (!payload || !payload.databaseId) {
          return NextResponse.json({ error: 'payload.databaseId is required' }, { status: 400 });
        }
        const { databaseId, ...filter } = payload;
        const res = await notionFetch(
          `/databases/${databaseId}/query`,
          apiKey,
          'POST',
          Object.keys(filter).length > 0 ? filter : undefined
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: (err as Record<string, string>).message || `HTTP ${res.status}` },
            { status: res.status }
          );
        }
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'appendBlocks': {
        if (!payload || !payload.blockId || !payload.children) {
          return NextResponse.json({ error: 'payload.blockId and payload.children are required' }, { status: 400 });
        }
        const { blockId, children } = payload;
        const res = await notionFetch(
          `/blocks/${blockId}/children`,
          apiKey,
          'PATCH',
          { children }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: (err as Record<string, string>).message || `HTTP ${res.status}` },
            { status: res.status }
          );
        }
        const data = await res.json();
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
