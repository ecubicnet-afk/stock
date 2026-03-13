import type { Metadata } from 'next';
import { AssignmentPage } from '@/src/components/pages/AssignmentPage';

export const metadata: Metadata = {
  title: '課題管理',
  description: '投資学習の課題と進捗管理',
};

export default function Page() {
  return <AssignmentPage />;
}
