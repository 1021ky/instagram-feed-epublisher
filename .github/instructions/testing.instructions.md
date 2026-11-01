---
description: "単体テスト・結合テスト・E2Eテストの日本語表記規約およびAgent-SOP遵守ルール"
applyTo: ["webapp/**/*.test.ts", "webapp/**/*.test.tsx", "webapp/e2e/**/*.spec.ts"]
---

# テストコード実装・表記規約（AIエージェント向け指示）

`webapp/` 配下の単体テスト・結合テスト（`*.test.ts`, `*.test.tsx`）および E2E テスト（`*.spec.ts`）を作成または変更する際は、以下のルールを**必ず（MUST）**遵守してください。

## 1. Agent-SOP スキルの必須参照

- **単体テスト・結合テスト（Vitest）**:
  - 実装・修正前に必ず `.agent/skills/vitest-test-authoring/SKILL.md` を読み、手順に従って実装すること。
- **E2E テスト（Playwright）**:
  - 実装・修正前に必ず `.agent/skills/playwright-e2e-authoring/SKILL.md` を読み、完了前に `.agent/skills/playwright-e2e-self-review/SKILL.md` でセルフレビューを実施すること。

## 2. テストケース表記ルール（日本語必須・一時番号禁止）

1. **`describe` も `it` / `test` もすべて日本語で記述すること**:
   - `describe(...)` / `test.describe(...)`、`it(...)` / `test(...)`、`it.each(...)` の説明テンプレートおよびラベルはすべて日本語で記述する。
   - 関数名・API パス・コンポーネント名を添える場合も、主文は日本語の責務・振る舞い名とし、括弧書きで識別子を補う形式とする（例: `describe("Instagram アクセストークン解決 (resolveInstagramAccessToken)", ...)`）。
   - 英語のみのテストスイート名・テストケース名（例: `describe("resolveInstagramAccessToken")`、`it("returns items on success")`）は禁止する。
2. **一時的なテスト番号プレフィックスの禁止**:
   - `UT-*`、`IT-*`、`TC-*`、`E2E-*` などの一時的な採番をコード上のテスト名やコメントに残さないこと。
