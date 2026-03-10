import { useMarketData } from '../hooks/useMarketData';
import { MarketSummary } from '../components/dashboard/MarketSummary';
import { IndexCard } from '../components/dashboard/IndexCard';
import { IndexCardSkeleton } from '../components/dashboard/IndexCardSkeleton';
import { SubIndicatorTable } from '../components/dashboard/SubIndicatorTable';
import { FearGreedGauge } from '../components/dashboard/FearGreedGauge';

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
  const { indices, forex, commodities, subIndicators, fearGreed, marketSummary, isLoading, lastUpdated } = useMarketData();

  // 全データソースから8シンボルを集めて表示順にソート
  const allItems = [...indices, ...forex, ...commodities];
  const dashboardItems = DASHBOARD_IDS
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => item != null);

  return (
    <div className="space-y-6 py-4">
      {/* マーケットサマリー */}
      <MarketSummary data={marketSummary} />

      {/* 最終更新日時 */}
      <div className="flex items-center justify-end gap-2 -mt-4">
        {isLoading ? (
          <span className="text-text-secondary text-xs font-mono animate-pulse">更新中...</span>
        ) : lastUpdated ? (
          <span className="text-text-secondary text-xs font-mono">
            最終更新: {new Date(lastUpdated).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        ) : null}
      </div>

      {/* 主要指数 8シンボル */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-accent-cyan" />
          主要指標
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <IndexCardSkeleton key={i} />)
            : dashboardItems.map((item) => <IndexCard key={item.id} item={item} />)}
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
