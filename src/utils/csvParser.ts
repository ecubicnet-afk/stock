import type { RakutenTrade } from '../types/tradeAnalysis';
import type { Holding } from '../types/portfolio';

/**
 * Shift-JIS対応でファイルをテキストとして読み込む
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      // まずShift-JISで試す
      try {
        const decoder = new TextDecoder('shift-jis');
        const text = decoder.decode(buffer);
        resolve(text);
      } catch {
        // fallback to UTF-8
        const decoder = new TextDecoder('utf-8');
        resolve(decoder.decode(buffer));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * CSVテキストを行・カラムに分割
 */
function parseCSVLines(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    // 簡易CSVパーサー（ダブルクォート対応）
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * 楽天証券 実現損益CSVをパース
 * カラム検出: 約定日, 銘柄コード, 銘柄名, 売買区分, 数量, 約定単価, 約定金額, 実現損益, 手数料, 税金 等
 */
export function parseRakutenTradeCSV(text: string): RakutenTrade[] {
  const rows = parseCSVLines(text);
  if (rows.length < 2) return [];

  // ヘッダー行を探す（「約定日」を含む行）
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (row.some((cell) => cell.includes('約定日'))) {
      headerIdx = i;
      headers = row;
      break;
    }
  }
  if (headerIdx === -1) return [];

  // カラムインデックスを特定
  const findCol = (keywords: string[]) =>
    headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const dateCol = findCol(['約定日']);
  const tickerCol = findCol(['銘柄コード', 'コード']);
  const nameCol = findCol(['銘柄名', '銘柄']);
  const sideCol = findCol(['売買区分', '売買']);
  const qtyCol = findCol(['数量', '株数']);
  const priceCol = findCol(['約定単価', '単価']);
  const amountCol = findCol(['約定金額', '金額']);
  const pnlCol = findCol(['実現損益', '損益']);
  const commCol = findCol(['手数料']);
  const taxCol = findCol(['税金', '税額']);

  const trades: RakutenTrade[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const dateVal = dateCol >= 0 ? row[dateCol] : '';
    if (!dateVal || dateVal.length < 4) continue;

    const sideStr = sideCol >= 0 ? row[sideCol] : '';
    const side: 'buy' | 'sell' = sideStr.includes('売') ? 'sell' : 'buy';

    const num = (col: number) => {
      if (col < 0 || col >= row.length) return 0;
      return parseFloat(row[col].replace(/[,，]/g, '')) || 0;
    };

    const realizedPnl = num(pnlCol);
    const commission = num(commCol);
    const tax = num(taxCol);

    trades.push({
      settlementDate: dateVal.replace(/\//g, '-'),
      ticker: tickerCol >= 0 ? row[tickerCol] : '',
      tickerName: nameCol >= 0 ? row[nameCol] : '',
      side,
      quantity: num(qtyCol),
      price: num(priceCol),
      amount: num(amountCol),
      realizedPnl,
      commission,
      tax,
      netPnl: realizedPnl - commission - tax,
    });
  }

  return trades;
}

/**
 * 楽天証券 保有銘柄CSVをパース（現物・信用）
 */
export function parseRakutenHoldingsCSV(
  text: string,
  accountType: 'spot' | 'margin'
): Holding[] {
  const rows = parseCSVLines(text);
  if (rows.length < 2) return [];

  // ヘッダー行を探す
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (
      row.some(
        (cell) =>
          cell.includes('銘柄コード') ||
          cell.includes('コード') ||
          cell.includes('銘柄名')
      )
    ) {
      headerIdx = i;
      headers = row;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const findCol = (keywords: string[]) =>
    headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const tickerCol = findCol(['銘柄コード', 'コード']);
  const nameCol = findCol(['銘柄名', '銘柄']);
  const qtyCol = findCol(['数量', '保有数量', '株数', '保有株数']);
  const avgCostCol = findCol(['平均取得', '取得単価', '取得価格']);
  const currentCol = findCol(['現在値', '時価', '現在価格']);
  const valueCol = findCol(['評価額', '時価評価額', '評価金額']);
  const costCol = findCol(['取得総額', '取得金額', '取得額']);
  const pnlCol = findCol(['評価損益', '含み損益', '損益']);

  const num = (row: string[], col: number) => {
    if (col < 0 || col >= row.length) return 0;
    return parseFloat(row[col].replace(/[,，]/g, '')) || 0;
  };

  const holdings: Holding[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const ticker = tickerCol >= 0 ? row[tickerCol]?.trim() : '';
    if (!ticker || ticker.length < 1) continue;

    const quantity = num(row, qtyCol);
    const avgCost = num(row, avgCostCol);
    const currentPrice = num(row, currentCol);
    let marketValue = num(row, valueCol);
    let costBasis = num(row, costCol);

    // 値が取れない場合は計算
    if (!marketValue && currentPrice && quantity) marketValue = currentPrice * quantity;
    if (!costBasis && avgCost && quantity) costBasis = avgCost * quantity;

    const unrealizedPnl = num(row, pnlCol) || marketValue - costBasis;
    const unrealizedPnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    holdings.push({
      ticker,
      tickerName: nameCol >= 0 ? row[nameCol]?.trim() : ticker,
      quantity,
      averageCost: avgCost,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPnl,
      unrealizedPnlPercent,
      weight: 0, // 後で計算
      accountType,
    });
  }

  return holdings;
}

/**
 * 複数口座の保有銘柄を集約（同一銘柄コードをマージ）
 */
export function aggregateHoldings(holdingsArrays: Holding[][]): Holding[] {
  const map = new Map<string, Holding>();

  for (const holdings of holdingsArrays) {
    for (const h of holdings) {
      const existing = map.get(h.ticker);
      if (existing) {
        const totalQty = existing.quantity + h.quantity;
        const totalCost = existing.costBasis + h.costBasis;
        const totalValue = existing.marketValue + h.marketValue;
        existing.quantity = totalQty;
        existing.costBasis = totalCost;
        existing.marketValue = totalValue;
        existing.averageCost = totalQty > 0 ? totalCost / totalQty : 0;
        existing.currentPrice = h.currentPrice || existing.currentPrice;
        existing.unrealizedPnl = totalValue - totalCost;
        existing.unrealizedPnlPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
        // 信用がある場合はmarginに
        if (h.accountType === 'margin') existing.accountType = 'margin';
      } else {
        map.set(h.ticker, { ...h });
      }
    }
  }

  const aggregated = Array.from(map.values());
  const totalValue = aggregated.reduce((sum, h) => sum + Math.abs(h.marketValue), 0);

  // ウェイト計算
  for (const h of aggregated) {
    h.weight = totalValue > 0 ? (Math.abs(h.marketValue) / totalValue) * 100 : 0;
  }

  return aggregated.sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue));
}
