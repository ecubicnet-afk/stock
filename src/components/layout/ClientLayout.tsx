'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useFirebaseSync } from '../../hooks/useFirebaseSync';
import { ErrorBoundary } from '../ErrorBoundary';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useFirebaseSync();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-primary">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-64 pt-16 md:pt-[132px] pb-8 px-4 md:px-6">
          {children}
        </main>
        <div className="lg:ml-64">
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  );
}
