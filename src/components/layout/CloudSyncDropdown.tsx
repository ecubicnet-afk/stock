import { useState, useRef, useEffect } from 'react';
import { useSyncActions } from '../../hooks/useSyncActions';

export function CloudSyncDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { syncStatus, saveAll, loadAll, isConfigured } = useSyncActions();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const busy = syncStatus.isSaving || syncStatus.isLoading;

  const handleLoad = () => {
    if (!window.confirm('クラウドのデータでローカルデータを上書きしますか？')) return;
    loadAll();
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return '--:--';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 transition-colors ${
          isConfigured
            ? 'text-accent-cyan hover:text-accent-cyan/80'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        title="クラウド同期"
      >
        {busy ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-bg-secondary border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <span
                className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-up' : 'bg-text-secondary/40'}`}
              />
              クラウド同期
            </div>
          </div>

          <div className="p-3 space-y-2">
            {!isConfigured && (
              <div className="px-1 py-2 text-xs text-amber-400/80 bg-amber-400/5 rounded text-center">
                設定画面でFirebaseの3項目を入力し、接続テストを実行してください
              </div>
            )}

            <button
              onClick={saveAll}
              disabled={busy}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncStatus.isSaving ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
              クラウドに保存
            </button>

            <button
              onClick={handleLoad}
              disabled={busy}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-card/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncStatus.isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3" />
                </svg>
              )}
              クラウドから読込
            </button>

            <div className="pt-1 text-[10px] text-text-secondary/60 space-y-0.5">
              <div>最終保存: {formatTime(syncStatus.lastSavedAt)}</div>
              <div>最終読込: {formatTime(syncStatus.lastLoadedAt)}</div>
            </div>

            {syncStatus.result && (
              <div
                className={`text-xs py-1.5 px-2 rounded ${
                  syncStatus.result === 'success'
                    ? 'text-up bg-up/10 text-center'
                    : 'text-down bg-down/10'
                }`}
              >
                {syncStatus.result === 'success'
                  ? (syncStatus.error || '完了')
                  : syncStatus.error || 'エラーが発生しました'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
