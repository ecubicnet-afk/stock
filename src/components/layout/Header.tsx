import { useClock } from '../../hooks/useClock';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { time, date, marketStatuses } = useClock();

  return (
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
      </div>
    </header>
  );
}
