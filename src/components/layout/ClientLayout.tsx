'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useFirebaseSync } from '../../hooks/useFirebaseSync';
import { ErrorBoundary } from '../ErrorBoundary';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  useFirebaseSync();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) setStorageWarning(detail.message);
    };
    window.addEventListener('storage-quota-error', handler);
    return () => window.removeEventListener('storage-quota-error', handler);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-primary">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-64 pt-16 md:pt-[132px] pb-8 px-4 md:px-6">
          {storageWarning && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
              <span>{storageWarning}</span>
              <button onClick={() => setStorageWarning(null)} className="ml-3 text-red-400/60 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          {children}
        </main>
        <div className="lg:ml-64">
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  );
}
