import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'ビジョンマップ',
  description: '投資目標とビジョンの可視化',
};

const VisionMapPage = dynamic(
  () => import('@/src/components/pages/VisionMapPage').then((m) => ({ default: m.VisionMapPage })),
  { loading: () => <div className="animate-pulse h-[80vh] bg-bg-secondary/30 rounded-xl" /> }
);

export default function Page() {
  return <VisionMapPage />;
}
