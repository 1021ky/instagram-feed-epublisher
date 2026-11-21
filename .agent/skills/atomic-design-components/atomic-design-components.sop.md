# アトミックデザイン コンポーネント実装・修正 SOP

## Overview

`webapp/` 配下のフロントエンド UI コンポーネントを新規作成・改修・共通化する際の必須手順（Standard Operating Procedure）を定義します。
Next.js App Router（`webapp/app/` = Pages 層）を前提に、過剰な階層化（Templates 等）を排した **実質 4 層（`src/components/` 配下は `atoms` / `molecules` / `organisms` の 3 層）** の責務境界、配置判断フロー、アクセシビリティ、バレルエクスポート、および単体テスト実装の基準を担保します。

## Steps

### 1. アトミックデザイン 3〜4 層の定義と配置判断

コンポーネントを作成または変更する際は、以下の定義と判断フローに従って配置ディレクトリを決定します。

```mermaid
flowchart TD
  Start["UI コンポーネントを配置・修正する"] --> Q1{"単一タグ＋アクセシビリティ属性のみで構成され、<br/>ドメイン知識・ビジネスロジックを持たないか？"}
  Q1 -- "Yes" --> Atoms["atoms/<br/>(例: FilterChip, InlineLoadingStatus)"]
  Q1 -- "No" --> Q2{"複数の Atom や基本要素を束ね、<br/>単一の役割を果たす複合UIパーツか？<br/>(セクション全体や複数機能を含まない)"}
  Q2 -- "Yes" --> Molecules["molecules/<br/>(例: HashtagQuickSelect, AlertBanner)"]
  Q2 -- "No" --> Q3{"ステップやカード、画面領域全体を司る<br/>独立したセクション・機能ブロックか？"}
  Q3 -- "Yes" --> Organisms["organisms/<br/>(例: FeedFilterStep, PostListStep, Navbar)"]
  Q3 -- "No" --> Pages["webapp/app/<br/>(ルーティング、全体状態、フェッチ統括)"]
```

#### 各層の責務と制約

1. **Layer 1: Atoms (`webapp/src/components/atoms/`)**
   - **責務**: これ以上分解できない最小単位の UI 要素。
   - **制約**:
     - **ドメイン知識を持たない（MUST）**: 特定のビジネスモデル（`FeedPostItem` や `EpubCustomSettings` など）に依存した Props を受け取らないこと。汎用的なプリミティブ型（`string`, `number`, `boolean`, コールバック関数等）のみを受け取る。
     - **セマンティクスとアクセシビリティの完結（MUST）**: `aria-pressed`, `role="status"`, `role="button"` 等の WAI-ARIA 属性を適切にカプセル化する。
     - **タップ領域（MUST）**: モバイル操作を前提とし、インタラクティブ要素は最低 44px（`min-h-[44px]`）のタップ領域を確保する。

2. **Layer 2: Molecules (`webapp/src/components/molecules/`)**
   - **責務**: 複数の Atoms や基本要素を組み合わせた、単一目的の複合 UI パーツ。
   - **制約**:
     - **単一責務の維持（MUST）**: 画面全体のレイアウトや無関係な機能（例: フィルター条件と投稿一覧の混在）を抱え込まないこと。
     - **ドメインモデルとの結合は最小限（SHOULD）**: 候補リスト（例: `HashtagSuggestion`）など特定コンテキストに特化してもよいが、画面全体の状態（`FeedFilterOptions` 全体等）を抱え込まず、入出力イベント（`onSelectTag` 等）で疎結合に保つ。

3. **Layer 3: Organisms (`webapp/src/components/organisms/`)**
   - **責務**: 独立した画面セクション、フォーム、ステップカード、ナビゲーション、モーダル。
   - **制約**:
     - **自己完結したブロック（MUST）**: Step 1（`FeedFilterStep`）、Step 2（`PostListStep`）、Step 3（`EpubCustomizeStep`）、`Navbar`、`LoginCard` など、独立して機能するまとまりとする。
     - 画面全体のレイアウトやルーティング状態の統括は Pages 層に委ね、単一責務のセクションとして自己完結させる。

4. **Layer 4: Pages (`webapp/app/`)**
   - **責務**: Next.js App Router のページ。全体の状態管理、データ取得、Organisms のオーケストレーションを担う。

---

### 2. ディレクトリ構成とバレルエクスポート規約

新しいコンポーネントを追加した場合は、各層のバレルファイル（`index.ts`）に登録します。

- `webapp/src/components/atoms/index.ts`: すべての Atom コンポーネントおよび Props 型をエクスポートする。
- `webapp/src/components/molecules/index.ts`: すべての Molecule コンポーネント、Props 型、および関連する純粋関数・定数をエクスポートする。
- `webapp/src/components/organisms/index.ts`: すべての Organism コンポーネントおよび Props 型をエクスポートする。

---

### 3. 単体テスト実装規約（`vitest-test-authoring` 準拠・完全コロケーション）

Atoms、Molecules、および Organisms の全コンポーネントは、保守性と検索性を最大化するため**「1コンポーネント = 1テストファイル（`[ComponentName].test.tsx`）」の 1:1 コロケーション（同ディレクトリ同名配置）を必須（MUST）**とします。

- **テストファイル配置（Colocation）**:
  - 各 `.tsx` コンポーネントファイルの真横に `[ComponentName].test.tsx` を配置する（例: `FilterChip.test.tsx`, `PostCard.test.tsx`, `Navbar.test.tsx` 等）。
  - 1つのテストファイルに複数コンポーネントを集約するアンチパターンは禁止する。
- **パラメータ化テストの義務化（`it.each`）**:
  - 表示状態（アクティブ/非アクティブ、件数あり/なし、disabled/readOnly 等）のバリエーションは `it.each` で網羅する。
- **日本語表記規約**:
  - すべての `describe` / `it` は日本語で仕様書として読めるように記述する。
- **HTML 属性のアサーション**:
  - Tailwind クラスの `disabled:*` と HTML 属性の `disabled=""` の誤判定を避けるため、属性検証時は `disabled=""` または厳格なセレクタを用いる。

---

### 4. 機械的品質ゲートとセルフレビューチェックリスト

変更作業を完了する前に、以下のコマンドを実行しすべて 0 件エラーで通過することを確認します。

```bash
# 1. 単体テスト実行
pnpm test

# 2. 静的解析（Oxlint）
pnpm lint

# 3. コードフォーマット検証（Oxfmt）
pnpm format:check

# 4. TypeScript 型チェック
pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit
```

#### セルフレビューチェックリスト

- [ ] Atom にビジネスロジックやドメイン全体の型を直接渡していないか？
- [ ] ボタン・チップ等の操作要素に 44px（`min-h-[44px]`）のタップ領域が確保されているか？
- [ ] `aria-pressed`, `role="status"`, `role="alert"` などの WAI-ARIA 属性が適切に設定されているか？
- [ ] 各ディレクトリの `index.ts` から公開されているか？
- [ ] 既存の E2E ロケータ（Playwright POM）に破壊的変更を与えていないか？
