# タスク管理: ルート README.md 改善とポータル化 (#37)

## 目標

リポジトリ直下の `README.md` を充実させ、プロジェクトの概要・管理対象・ディレクトリ構成・設計へのリンク・前提環境・セットアップ手順・今後の展望を網羅する総合ポータルとする。あわせて `webapp/README.md` を整理する。

## TODO

- [x] Issue #37 の作成
- [x] `main` からブランチ `docs/issue-37-improve-root-readme` を作成
- [x] ルート `README.md` の作成・充実
  - [x] アプリ概要・技術スタック
  - [x] 管理対象リソース
  - [x] ディレクトリ構成と役割
  - [x] アプリ・設計概要ドキュメントへのリンク (`designdoc/`, Mermaid 図等)
  - [x] 前提環境 (Node.js, pnpm, mkcert, Meta for Developers, Instagramプロアカウント)
  - [x] セットアップ・ローカル開発手順 (HTTPS証明書, .env.local, Meta設定, 起動)
  - [x] コード品質・開発コマンド (oxlint, oxfmt, pre-commit)
  - [x] 今後やりたいこと (Playwright E2Eテスト本格整備等)
- [x] `webapp/README.md` の整理
  - [x] 重複しているセットアップ手順をルートへの参照に誘導し、Webapp 固有情報に整理
- [x] 検証
  - [x] ドキュメント内のリンクが有効か確認
  - [x] oxlint / oxfmt / Markdown 構文等の確認
- [x] 完了・まとめ

---

## 追加タスク: ドキュメント更新ポリシー & 品質ツールの導入

- [x] ツール導入: `markdownlint-cli2`, `@mermaid-js/mermaid-cli`
- [x] 設定ファイル作成: `.markdownlint-cli2.jsonc`, `scripts/check-mermaid.mjs`
- [x] ドキュメント更新ポリシー作成:
  - [x] `docs/documentation-policy.md` (人間向け)
  - [x] `.github/instructions/documentation.instructions.md` (AIエージェント向け)
- [x] ドキュメント更新:
  - [x] `README.md` (ポリシーリンク追加、品質コマンド更新)
  - [x] `webapp/README.md` (コマンド一覧更新)
- [x] Husky & CI/CD 更新:
  - [x] `package.json` (`lint:md`, `check:mermaid`, `lint-staged`)
  - [x] `.husky/pre-commit` (ルート階層対応)
  - [x] `.github/workflows/webapp-ci.yml` (CI検証ジョブへの追加)
- [x] 総合検証:
  - [x] Markdown リント & フォーマット確認
  - [x] Mermaid 構文・変換確認
  - [x] CI コマンド通過確認
  - [x] コミット作成

---

## 追加タスク: 依存ライブラリのバージョン固定方針 (Exact Version Pinning)

- [x] ルート `.npmrc` 作成 (`save-exact=true`)
- [x] ルート `package.json` の devDependencies を Exact Version に固定
- [x] `webapp/package.json` の dependencies / devDependencies を Exact Version に固定
- [x] `docs/documentation-policy.md` にバージョン固定方針を明記
- [x] `pnpm install` による lockfile 同期
- [x] ローカル全検証（Mermaid, Markdown, oxlint, oxfmt, Vitest, tsc）パス確認
- [x] コミット & プッシュ作成
- [x] PR #38 の CI 通過確認 (Checks passing)

---

## 追加タスク: CIジョブの分割・名称改善

- [x] `webapp-ci.yml` の `quality` ジョブを `Document check` と `Webapp check` の2つに分割
- [x] `Document check`: Markdown lint, Format check, Mermaid check
- [x] `Webapp check`: Code lint, Type check, Unit tests
- [x] コミット & プッシュ作成
- [x] PR #38 の CI 通過確認 (`Document check`: 29s, `Webapp check`: 28s)

---

## 追加タスク: CIワークフローファイルの分割

- [x] `.github/workflows/document-ci.yml` 作成（Document check専任）
- [x] `.github/workflows/webapp-ci.yml` 更新（Webapp check専任）
- [x] ローカル全検証確認
- [x] コミット & プッシュ作成
- [x] PR #38 の CI 通過確認（Document CI: 38s / Webapp CI: 24s 共に成功）

---

## アプリデザイン刷新 (v2) 計画 & Issue準備

- [x] プロトタイプ (`feeds2epub_proto`) と現行実装のギャップ分析
- [x] モバイルUX（ステップ形式、タップ領域、Instagram WebView制約）の仕様検討
- [x] プロダクトポリシー策定（いいね数等のSNS付与情報はEPUBに出力しない）
- [x] `docs/designdoc/designDoc.md` へのプロダクトポリシー反映
- [x] 並列開発可能な 7 つの Issue 仕様書の作成 (`tasks/design-renewal-issues.md`)
- [x] GitHub Issue 起票（#39 〜 #45）
- [x] Issue #1 (#39) の実装着手（Tailwind CSS v4 & Lucide 導入）
  - [x] パッケージ追加 (Exact Version): `lucide-react`, `@tailwindcss/postcss`, `tailwindcss`
  - [x] `webapp/postcss.config.mjs` 作成
  - [x] `webapp/app/globals.css` に Tailwind v4 インポート及び Safe Area / dvh ユーティリティ定義
  - [x] 共通型定義 `webapp/src/types/ui.ts` 作成
  - [x] コンポーネント雛形ディレクトリ作成 (`auth`, `feed`, `epub`, `common`)
  - [x] 単体テスト `webapp/src/lib/ui-base.test.ts` 追加 & 検証パス
  - [x] `pnpm build` による Tailwind CSS v4 コンパイル・受入基準検証通過
  - [x] クリーンビルド用コマンドの追加 (`pnpm clean`, `pnpm build:clean`)
  - [x] セッション解決時の `getAccessToken` リクエスト形式修正 (`body` 指定)
  - [x] ルート `.gitignore` への SQLite ファイル除外設定追加

---

## Issue #3 (#41): Step 1（絞り込み）& Step 2（投稿確認・選択・固定バー）の実装

- [x] Step 1: 絞り込みフォームコンポーネント (`FeedFilterStep.tsx`)
  - [x] ハッシュタグ入力 ＋ よく使うタグボタン（`#100日チャレンジ` 等）
  - [x] 期間指定 ＋ プリセットボタン（「直近100日」「直近30日」「全期間」）
  - [x] 取得件数スライダー（10〜500件）
  - [x] 取得完了後のサマリー自動折りたたみ ＆ タップで再展開
  - [x] 44×44px 以上のタップ領域確保
- [x] Step 2: 投稿カードコンポーネント (`PostCard.tsx`)
  - [x] モバイル向け縦1列カードレイアウト（サムネイル画像＋日付＋キャプション冒頭＋いいね数）
  - [x] カード全体またはチェックボックスでの選択/除外トグル
  - [x] 44×44px 以上のタップ領域確保
- [x] Step 2: 投稿確認・選択リストコンポーネント (`PostListStep.tsx`)
  - [x] 「すべて選択」「選択解除」ボタン
  - [x] キャプション内キーワード検索バー
  - [x] 選択件数カウンター・空状態表示
- [x] 画面下部固定アクションバー (`StickyActionBar.tsx`)
  - [x] `fixed bottom-0` / iOS Safe Area 対応 (`pb-safe`)
  - [x] 「選択中: 〇件」表示と「本の設定に進む →」ボタン
- [x] 単体テスト & 検証
  - [x] `webapp/src/components/feed/feed-components.test.tsx` 作成 (17テスト)
  - [x] 受入基準の検証
  - [x] ビルド、リント、フォーマット確認

---

## PR #49: Step 1 / Step 2 UI コンポーネントと認証・デモモードの統合

- [x] `webapp/app/page.tsx` の UI 統合
  - [x] `FeedFilterStep` の統合（フィルター状態管理、自動折りたたみ・再展開）
  - [x] `PostListStep` の統合（投稿一覧、単一トグル、全選択/全解除、検索）
  - [x] `StickyActionBar` の統合（選択中件数、下部固定、本の設定へのスクロール導線）
  - [x] デモ体験モード（`handleDemo`）と Step 1 / Step 2 の連携（自動プリロード、サマリー折りたたみ、Step 2 遷移）
  - [x] EPUB 生成リクエスト（`requestEpub`）における選択中アイテムの連携
- [x] スタイル・レイアウトの確認と調整
  - [x] `StickyActionBar` 表示時の下部 Safe Area およびパディング調整
- [x] 自動テスト・品質ゲートの検証
  - [x] `pnpm test`
  - [x] `pnpm lint` && `pnpm format:check` && `pnpm check:mermaid`
  - [x] `pnpm build`
- [x] 動作確認 & PR 更新

---

## Issue #54: Better Auth のステートレス化（DBレス化）対応

- [x] `webapp/src/lib/auth.ts` のステートレス化
  - [x] `better-sqlite3` インポートおよび `database: new Database(...)` の削除
  - [x] `account: { storeAccountCookie: true }` の設定
  - [x] `session: { cookieCache: { ... } }` の設定
- [x] `webapp/src/lib/auth/session-service.ts` の更新
  - [x] `getAccessToken` 呼び出しに `useAccountCookie: true` を指定
- [x] 依存関係およびスクリプトの整理
  - [x] `webapp/package.json` から `better-sqlite3`, `@types/better-sqlite3` を削除
  - [x] `webapp/package.json` から `auth:migrate`, `predev`, `rebuild:native` を削除
  - [x] ルート `package.json` から `rebuild`, `rebuild:native` を削除し、`clean:all` を整理
  - [x] `pnpm-workspace.yaml` の `onlyBuiltDependencies` から `better-sqlite3` を削除
  - [x] `pnpm install` で lockfile を更新
- [x] ドキュメント更新
  - [x] `README.md` のネイティブビルド関連コマンド記述を整理
- [x] テストの更新と検証
  - [x] `session-service.test.ts` の更新
  - [x] `pnpm test` 全通過確認
  - [x] `pnpm lint` & `pnpm format:check` 全通過確認
  - [x] `tsc --noEmit` 型チェック全通過確認
  - [x] `pnpm build` 成功確認
  - [x] `better-auth.db` が生成されないことの確認
- [x] 学びと知見（`tasks/lessons.md`）の反映

---

## PR #61 レビュー指摘対応 (Copilot Review)

- [x] `pnpm-lock.yaml` から `better-sqlite3` の完全除去
  - [x] `package.json` に `pnpm.overrides: { "better-sqlite3": "-" }` を追加
  - [x] `pnpm-lock.yaml` を再生成し、`better-auth` の依存から `better-sqlite3` が完全に消去されたことを確認
- [x] `tasks/lessons.md` の記述修正
  - [x] 削除済みコマンド `rebuild:native` への言及を修正
  - [x] `pnpm.overrides` による optional peerDependencies 除外の知見を追記
- [x] 類似ミスの有無の点検
  - [x] 他のドキュメント（README等）における削除済みコマンド（`rebuild:native`, `clean:all`, `auth:migrate`）の残存がないことを確認
  - [x] 不要な環境変数（`BETTER_AUTH_DB_PATH` 等）の残存がないことを確認
- [x] 全検証（lint, format, test, typecheck, build）の通過確認

---

## PR #60: Meta審査向け法的・ポリシーページの改善

- [x] ルート `README.md` と `webapp/README.md` の重複解消（webapp以下を参照化）
- [x] `docs/documentation-policy.md` の更新（ディレクトリ構成更新方針）
- [x] `LegalPage.tsx` の「Meta 審査対応」バッジ削除
- [x] `/data-deletion` のリード文の自然化（エンドユーザー向け案内に改善）
- [x] お問い合わせ先の改善（環境変数 `NEXT_PUBLIC_CONTACT_FORM_URL` 導入・フォーム誘導へ更新）
- [x] 内部リンクを `<a>` から `next/link` へ置き換え
- [x] プライバシーポリシー・利用規約・データ削除手順の「EPUB」表記を「電子書籍」に一般化
- [x] テストコードの更新（`legal-pages.test.tsx`, `common-components.test.tsx`）
- [x] ドキュメント（環境変数一覧等）の更新
- [x] 全検証（test, lint, format, typecheck, build）通過確認

---

## 法的・ポリシーページ（/privacy, /terms, /data-deletion）のデザイン刷新

- [x] `LegalPage.tsx` のレイアウト・タイポグラフィ刷新（余白拡大、戻るボタンのピル化、見出しアクセントバー、セクション区切り線）
- [x] お問い合わせ用カードコンポーネント（`LegalContactBox`）の新設と適用
- [x] `globals.css` の法的ページスタイルの整理・Tailwind統合
- [x] `/privacy`, `/terms`, `/data-deletion` のマークアップ・可読性向上
- [x] テストおよびビルド検証の実行
- [x] コミット & プッシュ

---

## グローバル対応プライバシーポリシー更新（日本・EU/GDPR・米国/CCPA対応、日英版）

- [x] `LegalPage.tsx` に `backLabel` と `categoryLabel` の多言語対応プロップスを追加
- [x] 日本語版プライバシーポリシー（`webapp/app/privacy/page.tsx`）の更新（日本法・GDPR・CCPA要件網羅）
- [x] 英語版プライバシーポリシー（`webapp/app/privacy/en/page.tsx`）の新規作成
- [x] 単体テストの更新（日本語・英語版）
- [x] 全検証（test, lint, format, tsc, build）の実行
- [x] コミット & プッシュ
