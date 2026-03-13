import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'チャート',
  description: 'リアルタイムチャート分析',
};

const ChartPage = dynamic(
  () => import('@/src/components/pages/ChartPage').then((m) => ({ default: m.ChartPage })),
  { loading: () => <div className="animate-pulse h-[80vh] bg-bg-secondary/30 rounded-xl" /> }
);

export default function Page() {
  return <ChartPage />;
}
