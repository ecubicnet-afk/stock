'use client';
import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useStrategy } from '../../hooks/useStrategy';
import { useMemos } from '../../hooks/useMemos';
import { useSchedule } from '../../hooks/useSchedule';
import { useJournal } from '../../hooks/useJournal';
import { useTrades } from '../../hooks/useTrades';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useNotionExport } from '../../hooks/useNotionExport';
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

  // Notion export
  const { data: strategyData } = useStrategy();
  const { memos } = useMemos();
  const { events } = useSchedule();
  const { entries: journalEntries } = useJournal();
  const { trades } = useTrades();
  const { holdings } = usePortfolio();
  const {
    isConfigured: isNotionConfigured,
    isExporting,
    exportProgress,
    lastExportResults,
    testConnection: testNotionConn,
    exportAll,
    cancelExport,
    resetExportHistory,
  } = useNotionExport();
  const [notionTestResult, setNotionTestResult] = useState<{ success: boolean; error?: string; botName?: string } | null>(null);
  const [isNotionTesting, setIsNotionTesting] = useState(false);

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

  const handleNotionTest = async () => {
    setIsNotionTesting(true);
    setNotionTestResult(null);
    const result = await testNotionConn();
    setNotionTestResult(result);
    setIsNotionTesting(false);
  };

  const handleNotionExport = async () => {
    await exportAll({
      strategies: strategyData,
      memos,
      schedule: events,
      journal: journalEntries,
      trades,
      holdings,
    });
  };

  const totalExported = lastExportResults?.reduce((sum, r) => sum + r.result.created + r.result.updated, 0) ?? 0;
  const totalSkipped = lastExportResults?.reduce((sum, r) => sum + r.result.skipped, 0) ?? 0;
  const totalErrors = lastExportResults?.reduce((sum, r) => sum + r.result.errors.length, 0) ?? 0;

  const DATA_TYPE_LABELS: Record<string, string> = {
    strategies: '戦略',
    memos: 'メモ',
    schedule: 'スケジュール',
    journal: 'ジャーナル',
    trades: 'トレード',
    portfolio: 'ポートフォリオ',
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

            {/* Notion エクスポート設定 */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Notion エクスポート</h3>

              <div className="space-y-3">
                <div className="p-3 bg-bg-primary/30 border border-border/50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Notion APIキー（Integration Token）
                      {isNotionConfigured && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          {notionTestResult?.success ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          ) : notionTestResult && !notionTestResult.success ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          )}
                          <span className="text-xs">
                            {notionTestResult?.success ? '接続済み' : notionTestResult ? 'エラー' : '未テスト'}
                          </span>
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={settings.notionApiKey}
                      onChange={(e) => {
                        updateSettings({ notionApiKey: e.target.value });
                        setNotionTestResult(null);
                      }}
                      onBlur={(e) => updateSettings({ notionApiKey: e.target.value.trim() })}
                      placeholder="ntn_xxxxx... または secret_xxxxx..."
                      className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">親ページID</label>
                    <input
                      type="text"
                      value={settings.notionParentPageId}
                      onChange={(e) => updateSettings({ notionParentPageId: e.target.value })}
                      onBlur={(e) => updateSettings({ notionParentPageId: e.target.value.trim().replace(/-/g, '') })}
                      placeholder="エクスポート先のNotionページID（32文字の英数字）"
                      className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                    <p className="text-xs text-text-secondary/60 mt-1">
                      NotionページのURLの末尾32文字がページIDです。Integrationにページの共有を忘れずに。
                    </p>
                  </div>

                  {isNotionConfigured && (
                    <>
                      <button
                        onClick={handleNotionTest}
                        disabled={isNotionTesting}
                        className="w-full py-1.5 bg-accent-cyan/10 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
                      >
                        {isNotionTesting ? 'テスト中...' : 'Notion接続テスト'}
                      </button>

                      {notionTestResult && (
                        <div className={`mt-2 p-2 rounded text-xs ${notionTestResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {notionTestResult.success
                            ? `接続成功 - Bot: ${notionTestResult.botName || 'OK'}`
                            : notionTestResult.error || '接続に失敗しました'}
                        </div>
                      )}

                      <button
                        onClick={isExporting ? cancelExport : handleNotionExport}
                        disabled={isNotionTesting}
                        className={`w-full py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                          isExporting
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        }`}
                      >
                        {isExporting ? 'エクスポートを中止' : 'Notionへ全データをエクスポート'}
                      </button>

                      {/* Progress bar */}
                      {isExporting && exportProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-text-secondary">
                            <span>{DATA_TYPE_LABELS[exportProgress.currentType] || exportProgress.currentType}: {exportProgress.label}</span>
                            <span>{exportProgress.current}/{exportProgress.total}</span>
                          </div>
                          <div className="w-full h-1.5 bg-bg-primary/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                              style={{ width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Export results */}
                      {lastExportResults && !isExporting && (
                        <div className="p-2 rounded text-xs bg-bg-primary/50 space-y-1">
                          <p className="font-semibold text-text-primary">
                            エクスポート完了: {totalExported}件作成/更新, {totalSkipped}件スキップ
                            {totalErrors > 0 && <span className="text-red-400"> ({totalErrors}件エラー)</span>}
                          </p>
                          {lastExportResults.map((r) => (
                            <div key={r.type} className="text-text-secondary">
                              {DATA_TYPE_LABELS[r.type]}: +{r.result.created} 更新{r.result.updated} スキップ{r.result.skipped}
                              {r.result.errors.length > 0 && (
                                <span className="text-red-400"> エラー{r.result.errors.length}</span>
                              )}
                            </div>
                          ))}
                          {totalErrors > 0 && (
                            <details className="mt-1">
                              <summary className="text-red-400 cursor-pointer">エラー詳細</summary>
                              <div className="mt-1 space-y-0.5">
                                {lastExportResults.flatMap((r) =>
                                  r.result.errors.map((e, i) => (
                                    <p key={`${r.type}-${i}`} className="text-red-400 text-[10px]">{e}</p>
                                  ))
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      )}

                      <button
                        onClick={resetExportHistory}
                        disabled={isExporting}
                        className="w-full py-1 text-[10px] text-text-secondary/60 hover:text-text-secondary transition-colors disabled:opacity-50"
                      >
                        エクスポート履歴をリセット（次回は全データ再エクスポート）
                      </button>
                    </>
                  )}

                  <p className="text-xs text-text-secondary/60">
                    Notion Integrationは <span className="underline">notion.so/my-integrations</span> で作成できます。
                    Internal Integration Token を取得し、エクスポート先のページにIntegrationを共有してください。
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
