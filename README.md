# 投資ダッシュボード

株式投資ダッシュボード - リアルタイム市場データ、トレード日誌、ポートフォリオ管理

## 技術スタック

- **フレームワーク:** Next.js 16 (App Router) + React 19
- **言語:** TypeScript 5.9 (strict mode)
- **スタイリング:** Tailwind CSS v4
- **チャート:** Recharts + TradingView Widget
- **データベース:** Firebase Firestore (リアルタイム同期)
- **API:** Financial Modeling Prep (市場データ), Google Gemini (AI分析)
- **フォント:** next/font (JetBrains Mono, Noto Sans JP)

## プロジェクト構成

```
├── app/                    # Next.js App Router
│   ├── api/               # サーバーサイド API プロキシ
│   │   ├── fmp/           # Financial Modeling Prep API
│   │   └── gemini/        # Google Gemini API
│   ├── layout.tsx         # ルートレイアウト (フォント・メタデータ)
│   ├── page.tsx           # ダッシュボード (トップ)
│   ├── chart/             # チャート分析
│   ├── journal/           # トレード日誌
│   ├── portfolio/         # ポートフォリオ管理
│   ├── strategy/          # 戦略キャンバス
│   ├── memo/              # 市場メモ
│   ├── assignment/        # 課題管理
│   ├── trade-methods/     # トレード手法
│   ├── vision/            # ビジョンマップ
│   ├── robots.ts          # robots.txt 生成
│   └── sitemap.ts         # サイトマップ生成
│
├── src/
│   ├── components/        # React コンポーネント
│   │   ├── chart/         # チャート関連
│   │   ├── common/        # 共通コンポーネント
│   │   ├── dashboard/     # ダッシュボード
│   │   ├── journal/       # トレード日誌
│   │   ├── layout/        # レイアウト (Header, Sidebar, Footer)
│   │   ├── memo/          # メモ
│   │   ├── pages/         # ページコンポーネント
│   │   ├── schedule/      # スケジュール
│   │   ├── settings/      # 設定
│   │   └── strategy/      # 戦略キャンバス
│   │
│   ├── hooks/             # カスタムフック
│   ├── services/          # API・Firebase サービス
│   ├── types/             # TypeScript 型定義
│   ├── utils/             # ユーティリティ関数
│   └── index.css          # Tailwind CSS エントリー
│
└── .github/workflows/     # CI/CD
```

## パフォーマンス最適化

- **next/font:** フォントの自動最適化・プリロード (CLS 改善)
- **dynamic import:** 重いページコンポーネントの遅延読み込み (初期バンドル削減)
- **軽量 SVG スパークライン:** Recharts 依存を除去した SVG 直接描画
- **共有タイマー:** IndexCard の市場開閉チェックを単一の共有タイマーに統合
- **API キャッシュ:** サーバーサイド API ルートに Cache-Control ヘッダー設定
- **セキュリティヘッダー:** X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## 開発

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lint
npm run lint
```

## 環境変数

`.env.example` を `.env.local` にコピーして設定:

```
FMP_API_KEY=        # Financial Modeling Prep API キー
GEMINI_API_KEY=     # Google Gemini API キー
```

Firebase 設定はアプリ内の設定画面から行います。
