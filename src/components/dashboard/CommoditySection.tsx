'use client';
import type { MarketItem } from '../../types';
import { IndexCard } from './IndexCard';
import { IndexCardSkeleton } from './IndexCardSkeleton';

interface CommoditySectionProps {
  items: MarketItem[];
  isLoading: boolean;
}

export function CommoditySection({ items, isLoading }: CommoditySectionProps) {
  return (
    <section>
      <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-accent-gold rounded-full" />
        コモディティ
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <IndexCardSkeleton key={i} />)
          : items.map((item) => <IndexCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
