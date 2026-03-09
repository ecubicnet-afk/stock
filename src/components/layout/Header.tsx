import { useState } from 'react';
import { useClock } from '../../hooks/useClock';
import { SettingsModal } from '../settings/SettingsModal';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { time, date, marketStatuses } = useClock();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-4">
        {/* ハンバーガーメニュー（モバイル） */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* サイトタイトル */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-8 bg-accent-cyan rounded-full" />
          <h1 className="text-lg font-bold text-text-primary hidden sm:block">
            Investment Dashboard
          </h1>
          <h1 className="text-lg font-bold text-text-primary sm:hidden">
            InvDash
          </h1>
        </div>

        {/* 時計 */}
        <div className="ml-auto flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-xs text-text-secondary">{date}</div>
            <div className="font-mono text-lg font-semibold text-accent-cyan">{time}</div>
          </div>

          {/* 市場開閉インジケーター */}
          <div className="hidden lg:flex items-center gap-3">
            {marketStatuses.map((status) => (
              <div
                key={status.market}
                className="flex items-center gap-1.5 text-xs"
                title={status.nextEvent}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.isOpen ? 'bg-up animate-pulse' : 'bg-down'
                  }`}
                />
                <span className="text-text-secondary">{status.market}</span>
              </div>
            ))}
          </div>

          {/* 設定ボタン */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            title="設定"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
