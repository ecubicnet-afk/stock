import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'トレード日誌',
  description: '日々のトレード記録と振り返り',
};

const JournalPage = dynamic(
  () => import('@/src/components/pages/JournalPage').then((m) => ({ default: m.JournalPage })),
  { loading: () => <div className="animate-pulse h-[80vh] bg-bg-secondary/30 rounded-xl" /> }
);

export default function Page() {
  return <JournalPage />;
}
