/**
 * Notion Export Service
 * Handles exporting dashboard data to Notion databases via the /api/notion proxy route.
 */

import type {
  StrategyData,
  MemoEntry,
  ScheduleEvent,
  JournalEntry,
  TradeRecord,
  NotionDataType,
  NotionExportEntry,
  NotionDatabaseIds,
} from '../types';
import type { HoldingItem } from '../hooks/usePortfolio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  updatedExportMap: Record<string, NotionExportEntry>;
}

export interface ExportProgress {
  current: number;
  total: number;
  currentType: NotionDataType;
  label: string;
}

type ProgressCallback = (progress: ExportProgress) => void;

// ---------------------------------------------------------------------------
// Rate-limited API call queue (350ms between calls)
// ---------------------------------------------------------------------------

let lastCallTime = 0;
const MIN_INTERVAL = 350;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL - elapsed));
  }
  lastCallTime = Date.now();
}

async function notionApi(action: string, notionApiKey: string, payload?: object): Promise<any> {
  await throttle();
  const res = await fetch('/api/notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notionApiKey, payload }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Notion API error: ${res.status}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate text to Notion's 2000-char property limit */
function truncate(text: string, max = 2000): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 3) + '...' : text;
}

/** Convert text to Notion rich_text blocks (chunked to 2000 chars) */
function toRichTextChunks(text: string): Array<{ type: 'text'; text: { content: string } }> {
  if (!text) return [{ type: 'text', text: { content: '' } }];
  const chunks: Array<{ type: 'text'; text: { content: string } }> = [];
  for (let i = 0; i < text.length; i += 2000) {
    chunks.push({ type: 'text', text: { content: text.slice(i, i + 2000) } });
  }
  return chunks;
}

/** Create paragraph blocks for page body content */
function toParagraphBlocks(text: string): Array<object> {
  if (!text) return [];
  const blocks: Array<object> = [];
  for (let i = 0; i < text.length; i += 2000) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: text.slice(i, i + 2000) } }],
      },
    });
  }
  return blocks;
}

/** Create image blocks for external URLs (skip base64) */
function toImageBlocks(images?: string[]): { blocks: object[]; skippedCount: number } {
  if (!images || images.length === 0) return { blocks: [], skippedCount: 0 };
  const blocks: object[] = [];
  let skipped = 0;
  for (const img of images) {
    if (img.startsWith('data:')) {
      skipped++;
    } else {
      blocks.push({
        object: 'block',
        type: 'image',
        image: { type: 'external', external: { url: img } },
      });
    }
  }
  return { blocks, skippedCount: skipped };
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

export async function testNotionConnection(
  notionApiKey: string
): Promise<{ success: boolean; error?: string; botName?: string }> {
  try {
    const data = await notionApi('testConnection', notionApiKey);
    return data;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Database schemas & creation
// ---------------------------------------------------------------------------

const DB_SCHEMAS: Record<string, { title: string; icon: string; properties: object }> = {
  strategies: {
    title: '📊 戦略 (Strategies)',
    icon: '📊',
    properties: {
      'Name': { title: {} },
      'Type': { select: {} },
      'Summary': { rich_text: {} },
      'Notes Count': { number: {} },
      'Capital': { number: { format: 'number' } },
      'Risk %': { number: { format: 'percent' } },
      'Entry Price': { number: { format: 'number' } },
      'Stop Loss': { number: { format: 'number' } },
      'Local ID': { rich_text: {} },
    },
  },
  memos: {
    title: '📝 メモ (Memos)',
    icon: '📝',
    properties: {
      'Title': { title: {} },
      'Created': { date: {} },
      'Updated': { date: {} },
      'Image Count': { number: {} },
      'Local ID': { rich_text: {} },
    },
  },
  schedule: {
    title: '📅 スケジュール (Schedule)',
    icon: '📅',
    properties: {
      'Title': { title: {} },
      'Date': { date: {} },
      'Time': { rich_text: {} },
      'Importance': { select: { options: [
        { name: 'high', color: 'red' },
        { name: 'medium', color: 'yellow' },
        { name: 'low', color: 'blue' },
        { name: 'scenario', color: 'purple' },
      ] } },
      'Region': { select: { options: [
        { name: 'JP', color: 'red' },
        { name: 'US', color: 'blue' },
        { name: 'other', color: 'gray' },
      ] } },
      'Description': { rich_text: {} },
      'Local ID': { rich_text: {} },
    },
  },
  journal: {
    title: '📓 ジャーナル (Journal)',
    icon: '📓',
    properties: {
      'Date': { title: {} },
      'Condition': { number: {} },
      'Discipline': { number: {} },
      'Volatility': { number: {} },
      'Fear': { number: {} },
      'As Expected': { number: {} },
      'Local ID': { rich_text: {} },
    },
  },
  trades: {
    title: '💹 トレード (Trades)',
    icon: '💹',
    properties: {
      'Title': { title: {} },
      'Date': { date: {} },
      'Ticker': { rich_text: {} },
      'Ticker Name': { rich_text: {} },
      'Side': { select: { options: [
        { name: 'buy', color: 'green' },
        { name: 'sell', color: 'red' },
      ] } },
      'Quantity': { number: {} },
      'Price': { number: { format: 'number' } },
      'Total Amount': { number: { format: 'number' } },
      'P&L': { number: { format: 'number' } },
      'Emotion': { rich_text: {} },
      'Tags': { multi_select: {} },
      'Local ID': { rich_text: {} },
    },
  },
  portfolio: {
    title: '💼 ポートフォリオ (Portfolio)',
    icon: '💼',
    properties: {
      'Title': { title: {} },
      'Ticker': { rich_text: {} },
      'Quantity': { number: {} },
      'Avg Cost': { number: { format: 'number' } },
      'Current Price': { number: { format: 'number' } },
      'Market Value': { number: { format: 'number' } },
      'Unrealized P&L': { number: { format: 'number' } },
      'P&L %': { number: { format: 'percent' } },
      'Weight %': { number: { format: 'percent' } },
      'Account': { select: { options: [
        { name: 'spot', color: 'blue' },
        { name: 'margin', color: 'orange' },
      ] } },
      'Local ID': { rich_text: {} },
    },
  },
};

export async function ensureNotionDatabases(
  notionApiKey: string,
  parentPageId: string,
  existingIds: NotionDatabaseIds
): Promise<NotionDatabaseIds> {
  const result: NotionDatabaseIds = { ...existingIds };

  for (const [key, schema] of Object.entries(DB_SCHEMAS)) {
    const dataType = key as keyof NotionDatabaseIds;
    if (result[dataType]) continue;

    const payload = {
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: schema.title } }],
      icon: { type: 'emoji', emoji: schema.icon },
      properties: schema.properties,
    };

    const data = await notionApi('createDatabase', notionApiKey, payload);
    result[dataType] = data.id;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Export functions per data type
// ---------------------------------------------------------------------------

export async function exportStrategies(
  notionApiKey: string,
  dbId: string,
  data: StrategyData,
  exportMap: Record<string, NotionExportEntry>,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const result: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap } };
  const scenarios = data.scenarios || [];
  const total = scenarios.length;

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    onProgress?.({ current: i + 1, total, currentType: 'strategies', label: scenario.name });

    const existing = exportMap[scenario.id];
    const properties = {
      'Name': { title: [{ type: 'text', text: { content: scenario.name || 'Untitled' } }] },
      'Type': { select: { name: scenario.type || 'main' } },
      'Summary': { rich_text: toRichTextChunks(truncate(scenario.summary || '')) },
      'Notes Count': { number: scenario.notes?.length || 0 },
      'Capital': { number: data.positionSizing?.capital || 0 },
      'Risk %': { number: (data.positionSizing?.riskPercent || 0) / 100 },
      'Entry Price': { number: data.positionSizing?.entryPrice || 0 },
      'Stop Loss': { number: data.positionSizing?.stopLossPrice || 0 },
      'Local ID': { rich_text: [{ type: 'text', text: { content: scenario.id } }] },
    };

    // Build page body
    const bodyBlocks: object[] = [];
    if (scenario.summary) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'サマリー' } }] } });
      bodyBlocks.push(...toParagraphBlocks(scenario.summary));
    }
    if (data.scenarioDescription?.text) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'シナリオ説明' } }] } });
      bodyBlocks.push(...toParagraphBlocks(data.scenarioDescription.text));
    }
    if (scenario.notes?.length) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'ノート' } }] } });
      for (const note of scenario.notes) {
        const noteText = `[${note.region}/${note.direction}] ${note.title}: ${note.description}`;
        bodyBlocks.push(...toParagraphBlocks(noteText));
      }
    }

    try {
      if (existing) {
        await notionApi('updatePage', notionApiKey, { pageId: existing.notionPageId, properties });
        if (bodyBlocks.length > 0) {
          await notionApi('appendBlocks', notionApiKey, { blockId: existing.notionPageId, children: bodyBlocks.slice(0, 100) });
        }
        result.updated++;
        result.updatedExportMap[scenario.id] = { ...existing, exportedAt: new Date().toISOString() };
      } else {
        const pageData = await notionApi('createPage', notionApiKey, {
          parent: { database_id: dbId },
          properties,
          children: bodyBlocks.slice(0, 100),
        });
        result.created++;
        result.updatedExportMap[scenario.id] = {
          notionPageId: pageData.id,
          exportedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      result.errors.push(`Strategy "${scenario.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function exportMemos(
  notionApiKey: string,
  dbId: string,
  memos: MemoEntry[],
  exportMap: Record<string, NotionExportEntry>,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const result: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap } };
  const total = memos.length;

  for (let i = 0; i < memos.length; i++) {
    const memo = memos[i];
    onProgress?.({ current: i + 1, total, currentType: 'memos', label: truncate(memo.text, 30) });

    const existing = exportMap[memo.id];
    if (existing && memo.updatedAt <= existing.exportedAt) {
      result.skipped++;
      continue;
    }

    const titleText = memo.text?.slice(0, 50) || 'Untitled';
    const properties = {
      'Title': { title: [{ type: 'text', text: { content: titleText } }] },
      'Created': { date: { start: memo.createdAt?.slice(0, 10) || null } },
      'Updated': { date: { start: memo.updatedAt?.slice(0, 10) || null } },
      'Image Count': { number: memo.images?.length || 0 },
      'Local ID': { rich_text: [{ type: 'text', text: { content: memo.id } }] },
    };

    const bodyBlocks: object[] = [...toParagraphBlocks(memo.text)];
    const { blocks: imgBlocks, skippedCount } = toImageBlocks(memo.images);
    bodyBlocks.push(...imgBlocks);
    if (skippedCount > 0) {
      bodyBlocks.push(...toParagraphBlocks(`※ ${skippedCount}枚の画像はbase64形式のためエクスポートされませんでした`));
    }

    try {
      if (existing) {
        await notionApi('updatePage', notionApiKey, { pageId: existing.notionPageId, properties });
        result.updated++;
        result.updatedExportMap[memo.id] = { ...existing, exportedAt: new Date().toISOString() };
      } else {
        const pageData = await notionApi('createPage', notionApiKey, {
          parent: { database_id: dbId },
          properties,
          children: bodyBlocks.slice(0, 100),
        });
        result.created++;
        result.updatedExportMap[memo.id] = {
          notionPageId: pageData.id,
          exportedAt: new Date().toISOString(),
          updatedAt: memo.updatedAt,
        };
      }
    } catch (err) {
      result.errors.push(`Memo "${titleText}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function exportSchedule(
  notionApiKey: string,
  dbId: string,
  events: ScheduleEvent[],
  exportMap: Record<string, NotionExportEntry>,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const result: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap } };
  const total = events.length;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    onProgress?.({ current: i + 1, total, currentType: 'schedule', label: event.title });

    const existing = exportMap[event.id];
    if (existing) {
      result.skipped++;
      continue;
    }

    const properties: Record<string, object> = {
      'Title': { title: [{ type: 'text', text: { content: event.title || 'Untitled' } }] },
      'Time': { rich_text: [{ type: 'text', text: { content: event.time || '' } }] },
      'Importance': { select: { name: event.importance || 'medium' } },
      'Description': { rich_text: toRichTextChunks(truncate(event.description || '')) },
      'Local ID': { rich_text: [{ type: 'text', text: { content: event.id } }] },
    };

    if (event.date) {
      properties['Date'] = { date: { start: event.date } };
    }
    if (event.region) {
      properties['Region'] = { select: { name: event.region } };
    }

    const bodyBlocks: object[] = [];
    if (event.description) {
      bodyBlocks.push(...toParagraphBlocks(event.description));
    }
    const { blocks: imgBlocks, skippedCount } = toImageBlocks(event.images);
    bodyBlocks.push(...imgBlocks);
    if (skippedCount > 0) {
      bodyBlocks.push(...toParagraphBlocks(`※ ${skippedCount}枚の画像はbase64形式のためエクスポートされませんでした`));
    }

    try {
      const pageData = await notionApi('createPage', notionApiKey, {
        parent: { database_id: dbId },
        properties,
        children: bodyBlocks.slice(0, 100),
      });
      result.created++;
      result.updatedExportMap[event.id] = {
        notionPageId: pageData.id,
        exportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      result.errors.push(`Schedule "${event.title}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function exportJournal(
  notionApiKey: string,
  dbId: string,
  entries: JournalEntry[],
  exportMap: Record<string, NotionExportEntry>,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const result: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap } };
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    onProgress?.({ current: i + 1, total, currentType: 'journal', label: entry.date });

    const existing = exportMap[entry.id];
    if (existing && entry.updatedAt <= existing.exportedAt) {
      result.skipped++;
      continue;
    }

    const properties = {
      'Date': { title: [{ type: 'text', text: { content: entry.date } }] },
      'Condition': { number: entry.conditionRating || 0 },
      'Discipline': { number: entry.disciplineRating || 0 },
      'Volatility': { number: entry.volatilityRating || 0 },
      'Fear': { number: entry.fearRating || 0 },
      'As Expected': { number: entry.asExpectedRating || 0 },
      'Local ID': { rich_text: [{ type: 'text', text: { content: entry.id } }] },
    };

    const bodyBlocks: object[] = [];
    if (entry.marketOutlook) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '相場観' } }] } });
      bodyBlocks.push(...toParagraphBlocks(entry.marketOutlook));
    }
    if (entry.notes) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'ノート' } }] } });
      bodyBlocks.push(...toParagraphBlocks(entry.notes));
    }
    const { blocks: imgBlocks, skippedCount } = toImageBlocks(entry.images);
    bodyBlocks.push(...imgBlocks);
    if (skippedCount > 0) {
      bodyBlocks.push(...toParagraphBlocks(`※ ${skippedCount}枚の画像はbase64形式のためエクスポートされませんでした`));
    }

    try {
      if (existing) {
        await notionApi('updatePage', notionApiKey, { pageId: existing.notionPageId, properties });
        result.updated++;
        result.updatedExportMap[entry.id] = { ...existing, exportedAt: new Date().toISOString() };
      } else {
        const pageData = await notionApi('createPage', notionApiKey, {
          parent: { database_id: dbId },
          properties,
          children: bodyBlocks.slice(0, 100),
        });
        result.created++;
        result.updatedExportMap[entry.id] = {
          notionPageId: pageData.id,
          exportedAt: new Date().toISOString(),
          updatedAt: entry.updatedAt,
        };
      }
    } catch (err) {
      result.errors.push(`Journal "${entry.date}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function exportTrades(
  notionApiKey: string,
  dbId: string,
  trades: TradeRecord[],
  exportMap: Record<string, NotionExportEntry>,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const result: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap } };
  const total = trades.length;

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    onProgress?.({ current: i + 1, total, currentType: 'trades', label: `${trade.ticker} ${trade.side}` });

    const existing = exportMap[trade.id];
    if (existing) {
      result.skipped++;
      continue;
    }

    const titleText = `${trade.date} ${trade.ticker} ${trade.side}`;
    const properties: Record<string, object> = {
      'Title': { title: [{ type: 'text', text: { content: titleText } }] },
      'Date': { date: { start: trade.date } },
      'Ticker': { rich_text: [{ type: 'text', text: { content: trade.ticker } }] },
      'Ticker Name': { rich_text: [{ type: 'text', text: { content: trade.tickerName || '' } }] },
      'Side': { select: { name: trade.side } },
      'Quantity': { number: trade.quantity },
      'Price': { number: trade.price },
      'Total Amount': { number: trade.totalAmount },
      'Emotion': { rich_text: [{ type: 'text', text: { content: trade.emotion || '' } }] },
      'Local ID': { rich_text: [{ type: 'text', text: { content: trade.id } }] },
    };

    if (trade.pnl != null) {
      properties['P&L'] = { number: trade.pnl };
    }
    if (trade.tags?.length) {
      properties['Tags'] = { multi_select: trade.tags.map((t) => ({ name: t })) };
    }

    const bodyBlocks: object[] = [];
    if (trade.reason) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'トレード理由' } }] } });
      bodyBlocks.push(...toParagraphBlocks(trade.reason));
    }
    if (trade.emotion) {
      bodyBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '感情' } }] } });
      bodyBlocks.push(...toParagraphBlocks(trade.emotion));
    }
    const { blocks: imgBlocks, skippedCount } = toImageBlocks(trade.images);
    bodyBlocks.push(...imgBlocks);
    if (skippedCount > 0) {
      bodyBlocks.push(...toParagraphBlocks(`※ ${skippedCount}枚の画像はbase64形式のためエクスポートされませんでした`));
    }

    try {
      const pageData = await notionApi('createPage', notionApiKey, {
        parent: { database_id: dbId },
        properties,
        children: bodyBlocks.slice(0, 100),
      });
      result.created++;
      result.updatedExportMap[trade.id] = {
        notionPageId: pageData.id,
        exportedAt: new Date().toISOString(),
        updatedAt: trade.createdAt,
      };
    } catch (err) {
      result.errors.push(`Trade "${titleText}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function exportPortfolio(
  notionApiKey: string,
  dbId: string,
  holdings: HoldingItem[],
  accountType: string,
  exportMap: Record<string, NotionExportEntry>,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const result: ExportResult = { created: 0, updated: 0, skipped: 0, errors: [], updatedExportMap: { ...exportMap } };
  const total = holdings.length;

  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    onProgress?.({ current: i + 1, total, currentType: 'portfolio', label: `${h.code} ${h.name}` });

    const localId = `${accountType}_${h.code}`;
    const existing = exportMap[localId];

    const titleText = `${h.code} ${h.name}`;
    const properties = {
      'Title': { title: [{ type: 'text', text: { content: titleText } }] },
      'Ticker': { rich_text: [{ type: 'text', text: { content: h.code } }] },
      'Quantity': { number: h.quantity },
      'Avg Cost': { number: h.price },
      'Current Price': { number: h.price },
      'Market Value': { number: h.marketValue },
      'Unrealized P&L': { number: h.profit },
      'P&L %': { number: (h.profitRate || 0) / 100 },
      'Weight %': { number: (h.portfolioWeight || 0) / 100 },
      'Account': { select: { name: accountType } },
      'Local ID': { rich_text: [{ type: 'text', text: { content: localId } }] },
    };

    try {
      if (existing) {
        await notionApi('updatePage', notionApiKey, { pageId: existing.notionPageId, properties });
        result.updated++;
        result.updatedExportMap[localId] = { ...existing, exportedAt: new Date().toISOString() };
      } else {
        const pageData = await notionApi('createPage', notionApiKey, {
          parent: { database_id: dbId },
          properties,
        });
        result.created++;
        result.updatedExportMap[localId] = {
          notionPageId: pageData.id,
          exportedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      result.errors.push(`Portfolio "${titleText}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}
