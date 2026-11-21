# UI Components Directory Rules (`webapp/src/components/`)

Whenever you read, create, or modify any file in `webapp/src/components/`, you **MUST** follow these mandatory rules without exception:

1. **Mandatory Atomic Design SOP**:
   - Before authoring, modifying, or refactoring any UI component, you **MUST** read and follow [`.agent/skills/atomic-design-components/SKILL.md`](../../../.agent/skills/atomic-design-components/SKILL.md) (`atomic-design-components.sop.md`).
2. **Strict Layer Boundary & Placement**:
   - **Atoms (`atoms/`)**: 最小単位。ビジネスロジック・ドメインモデルを持たず、WAI-ARIA セマンティクスと 44px（`min-h-[44px]`）以上のタップ領域をカプセル化する。
   - **Molecules (`molecules/`)**: 複数の Atom や基本要素を組み合わせた単一目的の複合パーツ。画面全体の状態は抱え込まず入出力イベントで疎結合に保つ。
   - **Organisms (`organisms/`)**: 独立した画面セクション、フォーム、ステップカード、ナビゲーション、モーダル。
   - **Pages (`webapp/app/`)**: Next.js App Router ページ。全体ステート管理・データ取得・Organisms のオーケストレーション。
3. **Mandatory Unit Tests (`vitest-test-authoring` - 1:1 Colocation)**:
   - 全コンポーネント（Atoms / Molecules / Organisms）を追加・変更した際は、必ずコンポーネントファイルの真横に 1:1 コロケーションで単体テスト（`[ComponentName].test.tsx`）を作成・更新すること。
   - 入力パラメータによるバリエーションは `it.each` でパラメータ化し、日本語のテスト名で記述すること。
4. **Mechanical Quality Gate Enforcement**:
   - You **MUST** run `pnpm test`, `pnpm lint`, `pnpm format:check`, and `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` before concluding your task. Zero errors allowed.
