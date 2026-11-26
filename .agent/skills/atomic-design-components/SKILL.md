---
name: atomic-design-components
description: >-
  Standard Operating Procedure (Agent-SOP) for authoring, modifying, and refactoring
  UI components in webapp/src/components/ based on a 3-tier Atomic Design structure
  (Atoms, Molecules, Organisms + Pages in webapp/app/). Activate this skill whenever
  creating or updating any UI component.
---

# アトミックデザイン コンポーネント実装・修正 SOP

## Overview

`webapp/` 配下のフロントエンド UI コンポーネントを新規作成・改修・共通化する際の必須手順（Standard Operating Procedure）を定義します。
Next.js App Router（`webapp/app/` = Pages 層）を前提に、**Feature-First × アトミックデザイン（ハイブリッド構成）** として、汎用 UI 層（`src/components/{atoms,molecules,organisms}`）と機能ドメイン垂直スライス（`src/features/<domain>/{model,ui,index.ts}`）の責務境界、依存方向（下位層への単方向依存）、アクセシビリティ、および 1:1 単体テスト実装の基準を担保します。

## Steps

### 1. 配置判断フローとレイヤー定義

コンポーネントやプレゼンターを作成・変更する際は、以下の判断フローに従って配置ディレクトリを決定します。

```mermaid
flowchart TD
  Start["UI コンポーネントを配置・修正する"] --> Q0{"Instagram / EPUB 等の特定ドメイン知識や<br/>API型に依存するか？"}
  Q0 -- "Yes" --> Feature["features/&lt;domain&gt;/<br/>(model/: ViewModel変換, ui/: 機能固有UI, index.ts: Public API)<br/>例: features/feed/"]
  Q0 -- "No" --> Q1{"単一タグ＋アクセシビリティ属性のみで構成され、<br/>最小単位の汎用UIか？"}
  Q1 -- "Yes" --> Atoms["components/atoms/<br/>(例: FilterChip, InlineLoadingStatus, SelectionCheckbox)"]
  Q1 -- "No" --> Q2{"複数の Atom や基本要素を束ね、<br/>単一の役割を果たす汎用複合UIパーツか？"}
  Q2 -- "Yes" --> Molecules["components/molecules/<br/>(例: AlertBanner, StatusBanner)"]
  Q2 -- "No" --> Q3{"複数機能で共有する独立レイアウトブロックか？"}
  Q3 -- "Yes" --> Organisms["components/organisms/<br/>(例: Navbar, SiteFooter, LegalPage)"]
  Q3 -- "No" --> Pages["webapp/app/<br/>(ルーティング、全体状態、フェッチ統括)"]
```

#### 各層の責務と制約

1. **Layer 1: Atoms (`webapp/src/components/atoms/`)**
   - **責務**: これ以上分解できない最小単位の汎用 UI 要素。
   - **切り出し基準（2回目の原則 / 品質・a11y 先行抽出）**:
     - 一般的なロジック共通化では「Rule of Three（3回の法則）」が用いられるが、**タップ領域（44px 以上）、フォーカス可視化（`focus-visible`）、必須 WAI-ARIA 属性（`aria-label`、`aria-pressed`、`role="checkbox"` 等）など「品質やアクセシビリティを担保したい最小 UI パーツ」は、2回目が出たら（あるいは最初から）`webapp/src/components/atoms/` に切り出す（MUST）**。
     - 代表例: `IconButton`, `ActionButton`, `FilterChip`, `SelectionCheckbox`, `InlineLoadingStatus`, `InstagramBrandIcon`。
   - **Atom 側と呼び出し側の責務境界（Tailwind CSS × Atomic Design）**:
     - **Atom 側の責務**: 最小タップ領域（`min-h-[44px]` / `min-w-[44px]`）、フォーカス表示（`focus-visible:outline-none focus-visible:ring-2`）、必須の WAI-ARIA 属性（例: `IconButton` における `aria-label` の型レベル必須化）、基本レイアウト・カーソル・無効化状態の統一。
     - **呼び出し側の責務**: 親コンテナ内での位置調整用マージン・絶対配置（`-mr-1.5`, `absolute top-3 right-3` 等）、およびコンテキストに応じたカラーバリアントや幅指定。
   - **制約**:
     - **ドメイン知識を持たない（MUST）**: 特定のビジネスモデル（`FeedPostItem` や `EpubCustomSettings` など）に依存した Props を受け取らないこと。汎用的なプリミティブ型（`string`, `number`, `boolean`, コールバック関数等）のみを受け取る。
     - **セマンティクスとアクセシビリティの完結（MUST）**: `aria-pressed`, `role="status"`, `role="checkbox"` 等の WAI-ARIA 属性を適切にカプセル化する。
     - **タップ領域（MUST）**: モバイル操作を前提とし、インタラクティブ要素は最低 44px（`min-h-[44px]`）のタップ領域を確保する。

2. **Layer 2: Molecules (`webapp/src/components/molecules/`)**
   - **責務**: 複数の Atoms や基本要素を組み合わせた、ドメイン非依存の単一目的複合 UI パーツ（例: `AlertBanner`, `StatusBanner`, `ModalDialog`, `StepCardHeader`, `SegmentedControl`）。
   - **制約**:
     - **単一責務の維持（MUST）**: 画面全体のレイアウトや無関係な機能（例: フィルター条件と投稿一覧の混在）を抱え込まないこと。
     - **API / ドメイン型への非依存（SHOULD）**: 特定機能専用のカードやセレクタは `features/<domain>/` へ切り出す。

3. **Layer 3: Features (`webapp/src/features/<domain>/`)**
   - **責務**: 特定機能（例: `features/feed/`）に閉じたプレゼンター（`model/`）と UI 群（`ui/`）を垂直スライスとして管理する。
   - **制約**:
     - **API 構造と表示 Props の分離（SHOULD）**: `model/` のプレゼンター（例: `toPostCardViewModel`）で API 寄りの型を表示専用 ViewModel に変換し、末端 UI（`PostCard`, `PostThumbnail` 等）に API 構造を持ち込まない。
     - **セクション単位の合成（MUST）**: `PostCard` 等が肥大化する場合は、意味単位の小さなプレゼンテーション部品（`PostThumbnail`, `PostMetaHeader`, `CarouselPhotoStrip` 等）へ分割し、`return` 内で全体構成が一望できる宣言的コードにする。
     - **Public API 限定（MUST）**: 外部（`app/` 等）からは `features/<domain>/index.ts` が公開するシンボルのみを import し、下位層（`components/`・`lib/`）から `features/` への逆方向依存を禁止する。

4. **Layer 4: Organisms (`webapp/src/components/organisms/`) & Pages (`webapp/app/`)**
   - **Organisms**: 共通レイアウトブロック（`Navbar`, `SiteFooter`, `LegalPage` 等）および移行中の既存ステップ。
   - **Pages (`webapp/app/`)**: Next.js App Router のページ。全体の状態管理、データ取得、Feature / Organisms のオーケストレーションを担う。

---

### 2. ディレクトリ構成とバレルエクスポート規約

新しいコンポーネントを追加した場合は、各層のバレルファイル（`index.ts`）に登録します。

- `webapp/src/components/atoms/index.ts`: すべての Atom コンポーネントおよび Props 型をエクスポートする。
- `webapp/src/components/molecules/index.ts`: すべての Molecule コンポーネント、Props 型、および関連する純粋関数・定数をエクスポートする。
- `webapp/src/components/organisms/index.ts`: すべての Organism コンポーネントおよび Props 型をエクスポートする。

#### コメント・TSDoc / JSDoc 規約

- **`function` / `interface` / `type` には必ず JSDoc / TSDoc を記載する（MUST）**: コンポーネント関数・カスタムフック・ヘルパー関数・Props やモデルの型定義には、それが何を表すか・責務や制約を簡潔に記載する。
- **ディレクトリ名・型・コードから自明な冗長コメントは書かない（MUST NOT）**: ファイル配置から明らかな層表記（`(Atom)`, `(Molecule)` 等）、テストファイルの自明な見出し（`@file ... の単体テスト` 等）、実装をそのまま言い換える叙述コメントは書かず、二重メンテナンスを防ぐ。

---

### 3. 単体テスト実装規約（`vitest-test-authoring` 準拠・完全コロケーション）

Atoms、Molecules、および Organisms の全コンポーネントは、保守性と検索性を最大化するため**「1コンポーネント = 1テストファイル（`[ComponentName].test.tsx`）」の 1:1 コロケーション（同ディレクトリ同名配置）を必須（MUST）**とします。

- **テストファイル配置（Colocation）**:
  - 各 `.tsx` コンポーネントファイルの真横に `[ComponentName].test.tsx`（Small: `renderToStaticMarkup` によるマークアップ・ARIA・バリエーション検証）を配置する（例: `FilterChip.test.tsx`, `PostCard.test.tsx`, `Navbar.test.tsx` 等）。
  - クリック操作・キーボード（`Escape` 等）・フォーカス移動・44px タップ領域実測を伴うコンポーネントは、同ディレクトリに `[ComponentName].browser.test.tsx`（Medium: Vitest Browser Mode）を併置する。
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
# 1. 全テスト実行（Small -> Medium -> Large E2E）
pnpm test

# 2. 静的解析（Oxlint）
pnpm lint

# 3. コードフォーマット検証（Oxfmt）
pnpm format:check

# 4. Markdown 構文検証
pnpm lint:md

# 5. TypeScript 型チェック
pnpm typecheck
```

#### セルフレビューチェックリスト

- **Atoms**:
  - [ ] ドメイン知識や API 型に依存せず、汎用的な Props のみで構成されているか？
  - [ ] 操作要素のアクセシビリティ（十分なタップ領域・フォーカス可視化・適切な WAI-ARIA 属性）を Atom 側で担保し、配置余白やコンテキスト別バリアントは呼び出し側へ委譲できているか？
- **Molecules**:
  - [ ] 特定ドメインに依存せず、単一目的の複合 UI パーツとして責務が閉じているか？（機能固有のものは `features/` へ配置）
- **Features (`features/<domain>/`)**:
  - [ ] ロジック／ViewModel 変換（`model/`）と意味単位の UI 部品（`ui/`）が分離され、外部からは `index.ts` の Public API のみ公開されているか？
  - [ ] 下位層（`components/`・`lib/`）から `features/` への逆方向依存が発生していないか？
- **Organisms / Pages**:
  - [ ] `Organisms` は複数機能で共有するレイアウトブロックに留まり、`Pages`（`app/`）はオーケストレーションに専念しているか？
- **公開境界・テスト・ドキュメント・互換性**:
  - [ ] 各層の `index.ts` からのエクスポートと 1:1 コロケーションテスト（Small / 必要に応じた Medium）が揃っているか？
  - [ ] すべての `function` / `interface` / `type` に簡潔な TSDoc / JSDoc が記載され、`(Atom)` / `(Molecule)` や自明なテスト表記などの冗長コメントが紛れ込んでいないか？
  - [ ] 既存の E2E ロケータ（Playwright POM）やアクセシビリティ制御（`inert`・フォーカス誘導等）に破壊的変更を与えていないか？
