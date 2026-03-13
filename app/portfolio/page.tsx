import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'ポートフォリオ',
  description: '保有銘柄・資産配分の管理',
};

const PortfolioPage = dynamic(
  () => import('@/src/components/pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })),
  { loading: () => <div className="animate-pulse h-[80vh] bg-bg-secondary/30 rounded-xl" /> }
);

export default function Page() {
  return <PortfolioPage />;
}
