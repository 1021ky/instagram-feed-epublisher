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
