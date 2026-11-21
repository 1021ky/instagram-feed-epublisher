---
name: playwright-e2e-self-review
description: >-
  Standard Operating Procedure (Agent-SOP) for self-reviewing Playwright E2E tests
  and Page Object Models against Playwright Official Best Practices, POM boundaries,
  and Test Isolation before completing any E2E task.
---

# Playwright E2E Test Self-Review SOP

## Overview

This Standard Operating Procedure (SOP) defines the mandatory self-review checklist and verification steps that an AI agent MUST execute after writing or modifying any files under `webapp/e2e/`.

It combines mechanical static code analysis (`oxlint`) with architectural and semantic review criteria that static linters cannot judge alone (such as Page Object responsibility boundaries, semantic locator quality, and test isolation).

## Parameters

- **modified_files** (required): List of created or modified files under `webapp/e2e/`.
- **requirements_mapping** (required): Mapping between planned E2E user scenarios and the implemented `test(...)` blocks.

## Steps

### 1. Run Mechanical Static Analysis and Type Check

Verify that all mechanical Playwright Best Practice and POM rules pass with zero violations.

**Constraints:**

- You MUST run `pnpm lint` (`oxlint .`) and verify 0 errors and 0 warnings across `webapp/e2e/**/*.ts`.
- You MUST run `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` and verify 0 type errors.
- You MUST run `pnpm test` (`vitest`) to ensure the linter rule unit tests (`webapp/scripts/oxlint-plugin-playwright.test.ts`) and application unit/integration tests pass.
- If any error is reported, you MUST fix the root cause in the Page Object or spec file rather than disabling lint rules with `oxlint-disable` or `eslint-disable` comments.

### 2. Audit Page Object Model (POM) Responsibility Boundaries

Inspect every modified file in `webapp/e2e/pages/` and `webapp/e2e/*.spec.ts` to verify architectural cleanliness.

**Constraints:**

- You MUST verify that `.spec.ts` files express _what_ user scenario is being tested in domain language (e.g., `await feedFilterPage.selectHashtagChip("京都")`), not _how_ the DOM is queried.
- You MUST verify that all `test.describe(...)` and `test(...)` titles in `.spec.ts` are written in **Japanese** without English-only titles or temporary test ID prefixes (`TC-*`, `E2E-*`, etc.).
- You MUST verify that Page Object classes in `webapp/e2e/pages/` contain NO business assertions (`expect(...)`) and remain reusable across both positive and negative test cases.
- You MUST verify that every Page Object class is registered in `webapp/e2e/fixtures/test.ts` and injected via Playwright fixtures rather than instantiated with `new` inside `.spec.ts`.

### 3. Audit Locator Resilience and Accessibility Alignment

Inspect every locator definition inside `webapp/e2e/pages/*Page.ts`.

**Constraints:**

- You MUST verify that interactive elements (buttons, inputs, links, checkboxes, regions) are located via `getByRole`, `getByLabel`, `getByPlaceholder`, or `getByText`.
- You MUST verify that locators are scoped appropriately (e.g., chaining from a section region like `this.filterSection.getByRole(...)`) when multiple similar buttons could exist on the page.
- You MUST NOT leave any styling-dependent selectors (Tailwind classes, DOM depth chains) in Page Objects.

### 4. Audit Test Isolation and External Dependency Mocking

Verify that tests are deterministic, independent, and safe to run repeatedly in CI or locally.

**Constraints:**

- You MUST verify that no test depends on execution order or state mutated by a previous `test(...)` block.
- You MUST verify that external third-party APIs (such as live Instagram Graph API endpoints or OAuth providers) are never called directly during automated E2E runs; all external boundaries MUST be deterministically mocked or intercepted per test context.
- You MUST verify that every assertion uses a Web-First auto-retrying matcher (`toBeVisible`, `toHaveValue`, `toHaveCount`, `toHaveAttribute`, etc.) and that there are zero arbitrary delays.

### 5. Produce Self-Review Verification Summary

Record the self-review results before concluding the task.

**Constraints:**

- You MUST verify that every target test case from `requirements_mapping` has a corresponding, passing `test(...)` block.
- You SHOULD summarize the self-review checklist outcome (Static Analysis, POM Separation, User-Facing Locators, Web-First Assertions, Test Isolation) in the final report or task log.

## Examples

### Self-Review Checklist Output Template

```markdown
### Playwright E2E Self-Review Result

- [x] Static Analysis (`pnpm lint` / `tsc --noEmit`): 0 errors, 0 warnings
- [x] POM & Fixture Boundaries: All locators in `e2e/pages/`, injected via `e2e/fixtures/test.ts`, assertions only in `.spec.ts`
- [x] User-Facing Locators: `getByRole` / `getByLabel` used; `<datalist>` isolated in `FeedFilterPage`
- [x] Web-First Assertions: Only auto-retrying `await expect(locator).to*()` matchers used
- [x] Test Isolation & Network Safety: Independent `page` contexts, zero live requests to Instagram servers
```

## Troubleshooting

- **Test passes locally once but fails intermittently (Flakiness)**:
  Check whether an action is triggered before hydration or async data loading completes. Ensure the Page Object locator targets a user-visible element and that `.spec.ts` awaits a Web-First Assertion (`await expect(...).toBeVisible()`) before or after the interaction.
- **Linter rule suppression temptation**:
  You MUST NOT add `// oxlint-disable` or `// eslint-disable` to bypass `playwright-best-practices/*` rules. Refactor the Page Object or spec file instead.
