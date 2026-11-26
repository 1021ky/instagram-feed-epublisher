---
description: "Playwright E2E テストのベストプラクティス・POM構造・Agent-SOP遵守ルール"
applyTo:
  ["webapp/e2e/**", "webapp/playwright.config.ts", "webapp/scripts/oxlint-plugin-playwright*"]
---

# Playwright E2E テスト実装・レビュー規約（AIエージェント向け指示）

`webapp/e2e/` 配下の E2E テスト・Page Object・Fixture を作成または変更する際は、以下のルールを**必ず（MUST）**遵守してください。

## 1. Agent-SOP スキルの必須実行

1. **実装時（Authoring SOP）**:
   - コードを書く前に必ず `.agent/skills/playwright-e2e-authoring/SKILL.md`（または `playwright-e2e-authoring.sop.md`）を読み、Page Object Model (POM) + Custom Fixtures + Web-First Assertions の手順に従って実装すること。
2. **セルフレビュー時（Self-Review SOP）**:
   - 実装完了後、作業を完了とする前に必ず `.agent/skills/playwright-e2e-self-review/SKILL.md`（または `playwright-e2e-self-review.sop.md`）を読み、全チェック項目の検証とセルフレビューを実施すること。

## 2. 静的コード解析（`oxlint`）による機械的ゲート

`webapp/.oxlintrc.json` および `webapp/scripts/oxlint-plugin-playwright.mjs` により、以下のルールが `pnpm lint`（ローカル・pre-commit・GitHub Actions CI）で強制されます：

- `.spec.ts` 内での直接ロケータ呼び出し（`page.getByRole`, `page.locator` 等）および `page.goto` の禁止（`e2e/pages/` の Page Object 経由を強制）
- `.spec.ts` での `e2e/fixtures/test.ts` からの `{ test, expect }` インポート強制
- Page Object（`e2e/pages/*.ts`）内での `expect(...)` アサーション記述禁止
- Page Object 内での脆弱な CSS クラス / ID / XPath セレクタ禁止（`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText` を優先）
- 非 Web-First アサーション（`expect(await locator.isVisible())` 等）の禁止と `await` 漏れ防止
- `waitForTimeout`、`{ force: true }`、`page.$` / `page.$$`、`page.pause()`、`test.only` の禁止
