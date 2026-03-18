'use client';
import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { testFmpConnection } from '../../services/api';
import { testFirebaseConnection, isFirebaseConfigured } from '../../services/firebase';
import type { FmpTestResult } from '../../services/api';
import type { Settings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [testResult, setTestResult] = useState<FmpTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isFirebaseTesting, setIsFirebaseTesting] = useState(false);

  if (!isOpen) return null;

  const hasFirebaseConfig = isFirebaseConfigured(settings);

  const handleFirebaseTest = async () => {
    setIsFirebaseTesting(true);
    setFirebaseTestResult(null);
    const result = await testFirebaseConnection(settings);
    setFirebaseTestResult(result);
    setIsFirebaseTesting(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testFmpConnection();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, configured: false, workingSymbols: [], failedSymbols: [], message: '接続テストに失敗しました' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
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
                className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary [color-scheme:light]"
              >
                <option value="auto">自動取得（API + モックフォールバック）</option>
                <option value="mock">モックデータのみ</option>
              </select>
              <p className="text-xs text-text-secondary/60 mt-1">
                自動取得: 仮想通貨(CoinGecko)・為替(Frankfurter)・株価指数/コモディティ/VIX(FMP)・AI分析(Gemini)をリアルタイム取得。
              </p>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">自動更新間隔</label>
              <select
                value={settings.autoRefreshInterval}
                onChange={(e) => updateSettings({ autoRefreshInterval: Number(e.target.value) })}
                className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary [color-scheme:light]"
              >
                <option value={30}>30秒</option>
                <option value={60}>60秒</option>
                <option value={120}>2分</option>
                <option value={300}>5分</option>
                <option value={600}>10分</option>
                <option value={900}>15分</option>
                <option value={1800}>30分</option>
              </select>
            </div>

            {/* API設定（サーバーサイド環境変数で管理） */}
            <div className="p-3 bg-bg-primary/30 border border-border/50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  FMP / Gemini APIキー
                  <span className="ml-2 inline-flex items-center gap-1">
                    {testResult?.success ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    ) : testResult && !testResult.success ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    )}
                    <span className="text-xs">
                      {testResult?.success ? '接続済み' : testResult ? 'エラー' : '未テスト'}
                    </span>
                  </span>
                </label>
                <p className="text-xs text-text-secondary/60 mt-1">
                  APIキーはサーバーサイドの環境変数（.env.local）で安全に管理されています。
                  Vercelの場合はダッシュボードの Environment Variables で設定してください。
                </p>
              </div>

              <div>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full py-1.5 bg-accent-cyan/10 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'テスト中...' : 'FMP接続テスト'}
                </button>

                {testResult && (
                  <div className={`mt-2 p-2 rounded text-xs ${testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <p className="font-semibold mb-1">{testResult.message}</p>
                    {testResult.workingSymbols.length > 0 && (
                      <div className="mt-1">
                        <p className="text-text-secondary/80 mb-0.5">取得可能:</p>
                        {testResult.workingSymbols.map((s) => (
                          <span key={s.symbol} className="inline-block mr-2 mb-0.5 px-1.5 py-0.5 bg-emerald-50 rounded text-[10px]">
                            {s.symbol} (${s.price.toLocaleString()})
                          </span>
                        ))}
                      </div>
                    )}
                    {testResult.failedSymbols.length > 0 && (
                      <div className="mt-1">
                        <p className="text-text-secondary/80 mb-0.5">取得不可 (モック使用):</p>
                        {testResult.failedSymbols.map((s) => (
                          <span key={s} className="inline-block mr-2 mb-0.5 px-1.5 py-0.5 bg-red-50 rounded text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">クラウド同期 設定</h3>

              <div className="space-y-3">
                <div className="p-3 bg-bg-primary/30 border border-border/50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Firebase Project ID
                      {hasFirebaseConfig && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          {firebaseTestResult?.success ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          ) : firebaseTestResult && !firebaseTestResult.success ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          )}
                          <span className="text-xs">
                            {firebaseTestResult?.success ? '接続済み' : firebaseTestResult ? 'エラー' : '未テスト'}
                          </span>
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={settings.firebaseProjectId}
                      onChange={(e) => {
                        updateSettings({ firebaseProjectId: e.target.value });
                        setFirebaseTestResult(null);
                      }}
                      onBlur={(e) => updateSettings({ firebaseProjectId: e.target.value.trim() })}
                      placeholder="クラウド同期に使用（環境変数で設定済みの場合は空欄可）"
                      className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Firebase APIキー</label>
                    <input
                      type="password"
                      value={settings.firebaseApiKey}
                      onChange={(e) => {
                        updateSettings({ firebaseApiKey: e.target.value });
                        setFirebaseTestResult(null);
                      }}
                      onBlur={(e) => updateSettings({ firebaseApiKey: e.target.value.trim() })}
                      placeholder="Firebase Web APIキー（環境変数で設定済みの場合は空欄可）"
                      className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Firebase App ID</label>
                    <input
                      type="text"
                      value={settings.firebaseAppId}
                      onChange={(e) => {
                        updateSettings({ firebaseAppId: e.target.value });
                        setFirebaseTestResult(null);
                      }}
                      onBlur={(e) => updateSettings({ firebaseAppId: e.target.value.trim() })}
                      placeholder="Firebase App ID（環境変数で設定済みの場合は空欄可）"
                      className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      同期ID（Sync ID）
                    </label>
                    <input
                      type="text"
                      value={settings.syncId || ''}
                      onChange={(e) => {
                        updateSettings({ syncId: e.target.value });
                        setFirebaseTestResult(null);
                      }}
                      onBlur={(e) => updateSettings({ syncId: e.target.value.trim() })}
                      placeholder="複数デバイスで同じIDを入力（空欄＝このデバイスのみ）"
                      className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                    <p className="text-xs text-text-secondary/60 mt-1">
                      複数デバイスで同じ同期IDを設定すると、デバイス間でデータを共有できます。
                      空欄の場合はこのブラウザ固有のIDが使用されます。
                    </p>
                    {settings.syncId?.trim() && (
                      <p className="text-xs text-amber-600 mt-1">
                        注意: 同期IDを知っている人はデータにアクセスできます。推測されにくいIDを使用してください。
                      </p>
                    )}
                  </div>

                  {hasFirebaseConfig && (
                    <div>
                      <button
                        onClick={handleFirebaseTest}
                        disabled={isFirebaseTesting}
                        className="w-full py-1.5 bg-accent-cyan/10 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
                      >
                        {isFirebaseTesting ? 'テスト中...' : 'Firebase接続テスト'}
                      </button>

                      {firebaseTestResult && (
                        <div className={`mt-2 p-2 rounded text-xs ${firebaseTestResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {firebaseTestResult.success
                            ? '接続成功 - クラウド同期が利用可能です'
                            : firebaseTestResult.error || '接続に失敗しました'}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-text-secondary/60">
                    Firebase設定は環境変数（NEXT_PUBLIC_FIREBASE_*）で管理できます。
                    上記に入力すると環境変数より優先されます。
                  </p>
                </div>
              </div>
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
