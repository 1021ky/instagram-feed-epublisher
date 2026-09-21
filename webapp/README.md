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
| `pnpm build`         | Next.js 本番用ビルド                                         |
| `pnpm start`         | ビルド済みアプリケーションの起動                             |
| `pnpm lint`          | oxlint による静的解析                                        |
| `pnpm format`        | oxfmt によるコードフォーマット                               |
| `pnpm format:check`  | oxfmt によるフォーマットチェック                             |
| `pnpm test`          | Vitest による単体テスト実行                                  |
| `pnpm e2etest`       | Playwright による E2E テスト実行（※現在整備中）              |
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
│   ├── layout.tsx        # ルートレイアウト
│   └── page.tsx          # メイン UI 画面
├── certs/                # ローカル HTTPS 用証明書 (mkcert)
├── e2e/                  # Playwright E2E テスト
├── scripts/              # 開発サーバー実行スクリプト (dev-https.mjs)
└── src/
    └── lib/              # 共通ライブラリ・ロジック
        ├── auth/         # Better Auth 設定・セッションサービス
        ├── epub/         # EPUB ビルダー・レンダラー
        └── instagram/    # Instagram Graph API クライアント
```

---

## E2E テスト（Playwright）について

- テスト実行: `pnpm e2etest`
- デフォルトの `baseURL`: `http://localhost:3000`
- 現在は SSO ログインボタンの表示確認など簡易的なテストのみ実装されており、認証連携を含むエンドツーエンドテストはロードマップ（[ルート README.md](../README.md#7-今後やりたいこと-roadmap--todo)）として順次整備予定です。
