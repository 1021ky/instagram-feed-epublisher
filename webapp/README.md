# Webapp

`instagram-feed-epublisher` の Web アプリケーション本体です。
Next.js (App Router) + TypeScript + Better Auth を採用しています。

> [!NOTE]
> リポジトリ全体の概要、前提環境、Meta for Developers のセットアップ手順、環境変数の設定方法は、**[プロジェクトルートの README.md](../README.md)** を参照してください。

---

## 開発コマンド一覧

すべてのコマンドは `webapp/` ディレクトリ内で実行します（プロジェクトルートからも `pnpm <コマンド>` で直接実行可能です）。

| コマンド             | 説明                                                         |
| :------------------- | :----------------------------------------------------------- |
| `pnpm dev`           | 開発サーバー起動（ローカル HTTPS: `https://localhost:3000`） |
| `pnpm clean`         | Next.js ビルドキャッシュ（`.next`）の削除                    |
| `pnpm build`         | Next.js 本番用ビルド                                         |
| `pnpm build:clean`   | ビルドキャッシュ削除後のクリーンビルド                       |
| `pnpm start`         | ビルド済みアプリケーションの起動                             |
| `pnpm lint`          | oxlint による静的解析                                        |
| `pnpm format`        | oxfmt によるコードフォーマット                               |
| `pnpm format:check`  | oxfmt によるフォーマットチェック                             |
| `pnpm test`          | Vitest による単体・結合・OpenAPI 契約テスト実行              |
| `pnpm e2etest`       | Playwright によるフルスタック E2E テスト実行                 |
| `pnpm e2etest:ui`    | Playwright UI モードでのテスト実行                           |
| `pnpm e2etest:debug` | Playwright デバッグモードでのテスト実行                      |

---

## ディレクトリ構成

```text
webapp/
├── app/                  # Next.js App Router
│   ├── api/              # API Route Handlers
│   │   ├── auth/         # Better Auth 認証エンドポイント
│   │   ├── epub/         # EPUB 生成 API
│   │   └── instagram/    # Instagram Graph API プロキシ
│   ├── data-deletion/    # Meta 審査向けデータ削除手順ページ
│   ├── layout.tsx        # ルートレイアウト
│   ├── privacy/          # Meta 審査向けプライバシーポリシーページ
│   ├── page.tsx          # メイン UI 画面
│   └── terms/            # Meta 審査向け利用規約ページ
├── certs/                # ローカル HTTPS 用証明書 (mkcert)
├── e2e/                  # Playwright E2E テスト (POM + Custom Fixtures)
│   ├── fixtures/         # Page Object・API モック注入用 Custom Fixtures
│   └── pages/            # Page Object Model クラス群
├── scripts/              # 開発サーバー・OpenAPI モックサーバー・Oxlint プラグイン
└── src/
    ├── components/       # UI コンポーネント (auth, feed, epub, common)
    │   ├── auth/         # ナビゲーション、ログインカード、WebView注意バナー
    │   ├── common/       # 共通フッター、法的ページレイアウト
    │   ├── epub/         # EPUB 装丁設定・表紙テーマ・エクスポートモーダル
    │   └── feed/         # 絞り込みフォーム、投稿カード、選択リスト、下部アクションバー
    ├── lib/              # 共通ライブラリ・ロジック
    │   ├── auth/         # Better Auth 設定・セッションサービス
    │   ├── epub/         # EPUB ビルダー・レンダラー
    │   └── instagram/    # Instagram Graph API クライアント
    └── types/            # UI・ドメイン共通型定義 (ui.ts 等)
```

---

## E2E テスト（Playwright）について

- テスト実行（ヘッドレス）: `pnpm e2etest`
- ブラウザ目視実行（実ウィンドウ表示・1ワーカー・500ms スロー再生）: `pnpm e2etest:headed`
- インタラクティブ UI モード: `pnpm e2etest:ui`
- レポート出力付き実行（サーバーを常駐させず `webapp/playwright-report/` 配下に `index.html`・`summary.md`・`results.json`・動画・スクリーンショットを静的出力して終了）: `pnpm e2etest:report`
- デフォルトの E2E `baseURL`: `http://localhost:3100`（ローカル開発用の `https://localhost:3000` とポート競合しない独立プロセスで自動起動）
- 外部通信の安全性: `docs/openapi/instagram-graph-api.openapi.yaml` に準拠したローカルモックサーバー（`127.0.0.1:4010`）が自動起動し、本番 Instagram API へ一切アクセスせずに OAuth ログイン〜BFF API〜UI 操作を一気通貫で検証します。
- コード品質ガード: `webapp/e2e/AGENTS.md` および `scripts/oxlint-plugin-playwright.mjs` により、POM 構造・User-Facing ロケータ・Web-First Assertions が `pnpm lint` で機械的に強制されます。
