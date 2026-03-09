import { useMarketData } from '../hooks/useMarketData';
import { MarketSummary } from '../components/dashboard/MarketSummary';
import { IndexCard } from '../components/dashboard/IndexCard';
import { IndexCardSkeleton } from '../components/dashboard/IndexCardSkeleton';
import { SubIndicatorTable } from '../components/dashboard/SubIndicatorTable';
import { ForexSection } from '../components/dashboard/ForexSection';
import { CommoditySection } from '../components/dashboard/CommoditySection';
import { CryptoSection } from '../components/dashboard/CryptoSection';
import { FearGreedGauge } from '../components/dashboard/FearGreedGauge';
import { HeatmapPlaceholder } from '../components/dashboard/HeatmapPlaceholder';
import { CATEGORY_LABELS } from '../utils/constants';

const INDEX_CATEGORIES = ['japan', 'us', 'europe', 'asia'] as const;
const ACCENT_COLORS: Record<string, string> = {
  japan: 'bg-down',
  us: 'bg-up',
  europe: 'bg-accent-gold',
  asia: 'bg-accent-cyan',
};

export function DashboardPage() {
  const { indices, forex, commodities, crypto, subIndicators, fearGreed, marketSummary, isLoading } = useMarketData();

  return (
    <div className="space-y-6 py-4">
      {/* マーケットサマリー */}
      <MarketSummary data={marketSummary} />

      {/* 主要株価指数（地域別） */}
      {INDEX_CATEGORIES.map((category) => {
        const items = indices.filter((i) => i.category === category);
        const skeletonCount = category === 'europe' ? 3 : category === 'asia' ? 4 : 5;

        return (
          <section key={category}>
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className={`w-1 h-5 rounded-full ${ACCENT_COLORS[category]}`} />
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {isLoading
                ? Array.from({ length: skeletonCount }).map((_, i) => <IndexCardSkeleton key={i} />)
                : items.map((item) => <IndexCard key={item.id} item={item} />)}
            </div>
          </section>
        );
      })}

      {/* サブ指標 + 恐怖・強欲ゲージ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubIndicatorTable indicators={subIndicators} />
        </div>
        <FearGreedGauge data={fearGreed} />
      </div>

      {/* 為替 */}
      <ForexSection items={forex} isLoading={isLoading} />

      {/* コモディティ */}
      <CommoditySection items={commodities} isLoading={isLoading} />

      {/* 仮想通貨 */}
      <CryptoSection items={crypto} isLoading={isLoading} />

      {/* ヒートマップ（プレースホルダー） */}
      <HeatmapPlaceholder />
    </div>
  );
}
