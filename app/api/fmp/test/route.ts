import { NextResponse } from 'next/server';

const FMP_BASE = 'https://financialmodelingprep.com/stable';

export async function GET() {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      configured: false,
      message: 'FMP APIキーが環境変数に設定されていません',
    });
  }

  const allSymbols = ['^N225', '^TOPX', '^DJI', '^GSPC', '^NDX', 'CLUSD', 'GCUSD', '^VIX', '^TNX'];

  try {
    const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(allSymbols.join(','))}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        configured: true,
        message: `FMP API エラー: ${res.status}`,
      });
    }

    const data = await res.json();
    const quotes = Array.isArray(data) ? data : [];
    const working = quotes
      .filter((q: { price: number }) => q.price > 0)
      .map((q: { symbol: string; price: number }) => ({ symbol: q.symbol, price: q.price }));

    return NextResponse.json({
      success: working.length > 0,
      configured: true,
      workingSymbols: working,
      failedSymbols: allSymbols.filter((s) => !working.some((w: { symbol: string }) => w.symbol === s || decodeURIComponent(w.symbol) === s)),
      message: working.length > 0
        ? `接続成功: ${working.length}/${allSymbols.length}シンボル取得可能`
        : 'APIキーが無効、またはすべてのシンボルが取得不可です',
    });
  } catch {
    return NextResponse.json({
      success: false,
      configured: true,
      message: '接続テストに失敗しました',
    });
  }
}
