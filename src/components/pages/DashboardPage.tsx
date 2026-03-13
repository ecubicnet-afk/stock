'use client';
import { useMemo, memo } from 'react';
import { useMarketData } from '@/src/hooks/useMarketData';
import { IndexCard } from '@/src/components/dashboard/IndexCard';
import { IndexCardSkeleton } from '@/src/components/dashboard/IndexCardSkeleton';
import { SubIndicatorTable } from '@/src/components/dashboard/SubIndicatorTable';
import { FearGreedGauge } from '@/src/components/dashboard/FearGreedGauge';
import { Badge } from '@/src/components/ui/Badge';

const MemoizedIndexCard = memo(IndexCard, (prev, next) => prev.item.id === next.item.id && prev.item.currentValue === next.item.currentValue && prev.item.change === next.item.change);

// ダッシュボードに表示するシンボル（表示順）
const DASHBOARD_IDS = [
  'nikkei225',     // 日経平均
  'nikkei-futures', // 日経225先物
  'topix',         // TOPIX
  'djia',          // NYダウ
  'sp500',         // S&P 500
  'nasdaq100',     // NASDAQ 100
  'usdjpy',        // ドル円
  'wti',           // WTI原油
  'gold',          // 金
];

export function DashboardPage() {
  const { indices, forex, commodities, subIndicators, fearGreed, isLoading, lastUpdated, fmpStatus } = useMarketData();

  // 全データソースから8シンボルを集めて表示順にソート（memoized）
  const dashboardItems = useMemo(() => {
    const allItems = [...indices, ...forex, ...commodities];
    return DASHBOARD_IDS
      .map((id) => allItems.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => item != null)
      .filter((item) => {
        // FMP部分成功時のみモックを非表示（ライブデータがあるのでモックは不要）
        if (fmpStatus === 'partial' && item.dataSource === 'mock') return false;
        // 未設定 or 完全失敗時はモック含め全表示（空白ページ回避）
        return true;
      });
  }, [indices, forex, commodities, fmpStatus]);

  return (
    <div className="space-y-6 py-4">
      {/* FMPステータス + 最終更新日時 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {fmpStatus === 'partial' && <Badge variant="success">FMP API: ライブ取得中</Badge>}
          {fmpStatus === 'failed' && <Badge variant="danger">FMP API: 接続失敗（モック表示中）</Badge>}
          {fmpStatus === 'not-configured' && <Badge variant="neutral">APIキー未設定（モック表示中）</Badge>}
        </div>
        <div>
          {isLoading ? (
            <span className="text-text-secondary text-xs font-mono animate-pulse">更新中...</span>
          ) : lastUpdated ? (
            <span className="text-text-secondary text-xs font-mono">
              最終更新: {new Date(lastUpdated).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          ) : null}
        </div>
      </div>

      {/* FMP未設定ガイド */}
      {fmpStatus === 'not-configured' && (
        <div className="bg-bg-card/70 backdrop-blur-sm border border-info/20 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-info shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-text-primary font-medium">リアルタイムデータを有効にする</p>
            <p className="text-xs text-text-secondary mt-1">
              右上の設定アイコンからFMP APIキーを登録すると、リアルタイムの市場データが表示されます。
              現在はモックデータを表示中です。
            </p>
          </div>
        </div>
      )}

      {/* 主要指数 8シンボル */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-accent-cyan" />
          主要指標
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <IndexCardSkeleton key={i} />)
            : dashboardItems.map((item) => <MemoizedIndexCard key={item.id} item={item} />)}
        </div>
      </section>

      {/* サブ指標 + 恐怖・強欲ゲージ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubIndicatorTable indicators={subIndicators} />
        </div>
        <FearGreedGauge data={fearGreed} />
      </div>
    </div>
  );
}
