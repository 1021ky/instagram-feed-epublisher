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
- [ ] PR #38 の CI 通過確認（Document CI / Webapp CI の両ワークフロー）
