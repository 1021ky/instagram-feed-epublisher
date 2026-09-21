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
