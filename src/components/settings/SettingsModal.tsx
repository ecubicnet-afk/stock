import { useSettings } from '../../hooks/useSettings';
import type { Settings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">設定</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">データソース</label>
              <select
                value={settings.dataSource}
                onChange={(e) => updateSettings({ dataSource: e.target.value as Settings['dataSource'] })}
                className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary [color-scheme:dark]"
              >
                <option value="auto">自動取得（API + モックフォールバック）</option>
                <option value="mock">モックデータのみ</option>
              </select>
              <p className="text-xs text-text-secondary/60 mt-1">
                自動取得: 仮想通貨(CoinGecko)・為替(frankfurter)をリアルタイム取得。株価指数はモックデータ。
              </p>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">自動更新間隔</label>
              <select
                value={settings.autoRefreshInterval}
                onChange={(e) => updateSettings({ autoRefreshInterval: Number(e.target.value) })}
                className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary [color-scheme:dark]"
              >
                <option value={30}>30秒</option>
                <option value={60}>60秒</option>
                <option value={120}>2分</option>
                <option value={300}>5分</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">FMP APIキー（任意）</label>
              <input
                type="password"
                value={settings.fmpApiKey}
                onChange={(e) => updateSettings({ fmpApiKey: e.target.value })}
                placeholder="APIキーを入力（株価指数の自動取得に必要）"
                className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
              />
              <p className="text-xs text-text-secondary/60 mt-1">
                Financial Modeling Prepの無料APIキーで株価指数・コモディティも自動取得可能
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg hover:bg-accent-cyan/30 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
