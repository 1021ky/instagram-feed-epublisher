---
description: "ドキュメントおよびMermaid図面の更新ポリシーと品質検証基準"
applyTo: ["**/*.md", "docs/designdoc/**", "webapp/src/**", "webapp/app/**"]
---

# ドキュメント更新ポリシー（AIエージェント向け指示）

このリポジトリで作業する AI エージェントは、コードや設計の変更を行う際に以下のルールを必ず遵守してください。

## 1. ドキュメントの役割分担

- **`README.md` (ルート)**: プロジェクト全体の総合ポータル。環境変数、前提条件、起動方法、ディレクトリ構成の変更時は必ず更新する。
- **`webapp/README.md`**: Web アプリケーション開発固有のコマンドや内部構成リファレンス。
- **`docs/designdoc/`**: システムの設計資産。
  - `designDoc.md`: 要件・設計・技術選定の経緯
  - `erDiagram.mmd`: データモデル・ER図
  - `flowchart LR.mmd`: 全体ユーザーフロー図
  - `sequenceDiagram.mmd`: 認証・API 通信シーケンス図
- **`docs/documentation-policy.md`**: ドキュメント管理の詳細ポリシー正本。

## 2. コード変更時のドキュメント同時更新

コードやディレクトリ構造を変更した場合、以下の対応を同一コミット／プルリクエストで行うこと：

- API エンドポイントや認証フローの変更 ➔ `docs/designdoc/sequenceDiagram.mmd` を更新
- 画面操作や全体フローの変更 ➔ `docs/designdoc/flowchart LR.mmd` を更新
- データモデル（DBやセッション等）の変更 ➔ `docs/designdoc/erDiagram.mmd` を更新
- 環境変数や外部サービス連携の追加・変更 ➔ ルート `README.md` を更新
- 新規ディレクトリやファイルの追加 ➔ ルート `README.md` のツリー表示を更新

## 3. 品質検証の必須実行

変更完了前に以下の検証コマンドを実行し、エラーおよび警告が 0 件であることを確認すること：

- Markdown リント: `pnpm lint:md`（または自動修正 `pnpm lint:md:fix`）
- Markdown フォーマット: `pnpm format:check`（修正は `pnpm format`）
- Mermaid 図面構文検証: `pnpm check:mermaid`
