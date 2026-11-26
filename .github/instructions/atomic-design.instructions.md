---
description: "Feature-First × アトミックデザイン（FSDハイブリッド）に基づくUIコンポーネント作成・改修規約およびAgent-SOP遵守ルール"
applyTo:
  [
    "webapp/src/components/**/*.tsx",
    "webapp/src/components/**/*.ts",
    "webapp/src/features/**/*.tsx",
    "webapp/src/features/**/*.ts",
  ]
---

# UIコンポーネント実装・設計規約（AIエージェント向け指示）

`webapp/src/components/` および `webapp/src/features/` 配下のフロントエンド UI コンポーネントを作成または変更する際は、以下のルールを**必ず（MUST）**遵守してください。

## 1. Agent-SOP スキルの必須参照

UI コンポーネントの実装・修正・リファクタリングに着手する前に、必ず [`.agent/skills/atomic-design-components/SKILL.md`](../../.agent/skills/atomic-design-components/SKILL.md) を読み、定義された手順と配置判断フローに従うこと。

## 2. Feature-First × アトミックデザインの責務分離

Next.js App Router（`webapp/app/` = Pages）を前提とし、**汎用UI（`src/components/`）** と **機能ドメインUI（`src/features/<domain>/`）** を明確に分離します。

1. **Atoms (`webapp/src/components/atoms/`)**:
   - 最小単位の汎用 UI 要素（`FilterChip`, `InlineLoadingStatus`, `SelectionCheckbox` 等）。
   - ドメイン知識・ビジネスモデル（`FeedPostItem` 等）に依存してはならない。プリミティブ型のみを受け取る。
   - インタラクティブ要素は 44px（`min-h-[44px]`）以上のタップ領域を確保する。
2. **Molecules (`webapp/src/components/molecules/`)**:
   - 複数の Atom や基本要素を組み合わせた、ドメイン非依存の汎用複合 UI パーツ（`AlertBanner`, `StatusBanner` 等）。
   - 画面全体の状態管理を抱え込まず、イベントで疎結合に保つ。
3. **Features (`webapp/src/features/<domain>/`)**:
   - 特定ドメイン（Instagram 投稿一覧・選択、EPUB 装丁など）に紐づく UI と ViewModel 変換を垂直スライスとして格納する（例: `features/feed/`）。
   - **`model/`**: API 構造（`FeedPostItem` 等）から UI 表示専用 ViewModel への変換プレゼンターを配置する。
   - **`ui/`**: 意味単位の小さなプレゼンテーション部品（`PostThumbnail`, `PostMetaHeader`, `CarouselPhotoStrip`）と、それらを合成する `PostCard` / `PostListStep` を配置する。
   - **`index.ts`**: 外部（Pages 層）へ公開する Public API のみをエクスポートする。
4. **Organisms (`webapp/src/components/organisms/`)** _(段階的に `features/` へ移行中)_:
   - 既存ステップコンポーネント（`FeedFilterStep`, `EpubCustomizeStep`, `Navbar` 等）。新規のドメイン機能セクションは `features/<domain>/` へ配置する。
5. **Pages (`webapp/app/`)**:
   - ルーティング、ページ全体の状態管理・データ取得・Feature / Organism のオーケストレーション。

## 3. バレルファイルと単体テストの義務化

- 外部公開するコンポーネント・型は各層または各 Feature の `index.ts` からエクスポートする。
- すべての `function` / `interface` / `type` には何を表すものかを説明する JSDoc / TSDoc を必ず記載し、一方でディレクトリ名やコードから自明な冗長コメント（`(Atom)` / `(Molecule)` 表記、`@file ... の単体テスト` 等）は書かない。
- 全コンポーネント（Atoms / Molecules / Organisms / `features/*/ui/`）およびプレゼンターの作成・更新時は、同ディレクトリに 1:1 コロケーションで `*.test.tsx` / `*.test.ts` を配置し、`it.each` を用いた網羅的な単体テスト（日本語表記）を作成する。
- 変更完了前に `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` を実行してエラー 0 件を確認する。
