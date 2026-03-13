import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: '戦略キャンバス',
  description: 'チャート分析・戦略ビジュアライゼーション',
};

const StrategyPage = dynamic(
  () => import('@/src/components/pages/StrategyPage').then((m) => ({ default: m.StrategyPage })),
  { loading: () => <div className="animate-pulse h-[80vh] bg-bg-secondary/30 rounded-xl" /> }
);

export default function Page() {
  return <StrategyPage />;
}
