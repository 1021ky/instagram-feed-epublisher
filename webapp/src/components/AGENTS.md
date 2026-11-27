# UI Components Directory Rules (`webapp/src/components/` & `webapp/src/features/`)

Whenever you read, create, or modify any file in `webapp/src/components/` or `webapp/src/features/`, you **MUST** follow these mandatory rules without exception:

1. **Mandatory Feature-First × Atomic Design SOP**:
   - Before authoring, modifying, or refactoring any UI component, you **MUST** read and follow [`.agent/skills/atomic-design-components/SKILL.md`](../../../.agent/skills/atomic-design-components/SKILL.md) (`atomic-design-components.sop.md`).
2. **Strict Layer Boundary & Placement**:
   - **Atoms (`src/components/atoms/`)**: 最小単位の汎用 UI 要素。ビジネスロジック・ドメインモデルを持たず、WAI-ARIA セマンティクスと 44px（`min-h-[44px]`）以上のタップ領域をカプセル化する。
   - **Molecules (`src/components/molecules/`)**: 複数の Atom や基本要素を組み合わせた汎用複合 UI パーツ。ドメイン・API 型へ直接依存させない。
   - **Features (`src/features/<domain>/`)**: 特定機能ドメイン（例: `features/feed/`）の垂直スライス。`model/`（ViewModel 変換プレゼンター）と `ui/`（意味単位の部品とステップ UI）を持ち、`index.ts` 経由で Public API のみ公開する。
   - **Organisms (`src/components/organisms/`)**: 既存共通セクション・モーダル群（機能固有ステップは段階的に `features/` へ移行）。
   - **Pages (`webapp/app/`)**: Next.js App Router ページ。全体ステート管理・データ取得・Feature / Organisms のオーケストレーション。
3. **Mandatory Unit Tests (`vitest-test-authoring` - 1:1 Colocation)**:
   - 全コンポーネント（Atoms / Molecules / Organisms / `features/*/ui/`）およびプレゼンターを追加・変更した際は、必ずファイルの真横に 1:1 コロケーションで単体テスト（`[Name].test.tsx` / `[Name].test.ts`）を作成・更新すること。
   - 入力パラメータによるバリエーションは `it.each` でパラメータ化し、日本語のテスト名で記述すること。
4. **TSDoc / JSDoc & Concise Comments**:
   - 実装ファイルの先頭には、中身を開かなくても役割・振る舞いが具体的に伝わる 1 文で `@file` を必ず記載すること。
   - すべての `function` / `interface` / `type` には、何を表すものかを簡潔に説明する JSDoc / TSDoc を必ず記載すること。
   - ディレクトリ名・型・コードから自明な冗長コメント（`(Atom)` / `(Molecule)` 表記や `@file ... の単体テスト` 等）は記載しないこと。
5. **Mechanical Quality Gate Enforcement**:
   - You **MUST** run `pnpm test`, `pnpm lint`, `pnpm format:check`, and `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` before concluding your task. Zero errors allowed.
