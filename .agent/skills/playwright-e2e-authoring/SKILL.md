---
name: playwright-e2e-authoring
description: >-
  Standard Operating Procedure (Agent-SOP) for authoring and modifying Playwright E2E tests
  and Page Object Models in webapp/e2e/. Activate this skill whenever creating or updating
  any E2E test (.spec.ts), Page Object (e2e/pages/), or Playwright fixture (e2e/fixtures/).
---

# Playwright E2E Test Authoring SOP

## Overview

This Standard Operating Procedure (SOP) defines the mandatory workflow for designing and implementing Playwright End-to-End (E2E) tests in `webapp/e2e/` in strict accordance with [Playwright Official Best Practices](https://playwright.dev/docs/best-practices) and [Page Object Models (POM)](https://playwright.dev/docs/pom).

Every E2E test in this repository is guarded by both this SOP and static code analysis (`oxlint` with `webapp/scripts/oxlint-plugin-playwright.mjs`). Following these steps ensures maintainable, deterministic, and non-flaky E2E tests.

## Parameters

- **target_feature** (required): The user-facing feature or user journey to be tested.
- **test_cases** (required): List of user-visible acceptance criteria to verify (written in Japanese).
- **page_objects** (optional, default: `webapp/e2e/pages/`): Target Page Object classes to create or extend.
- **spec_file** (required): Path to the `.spec.ts` file under `webapp/e2e/`.

## Steps

### 1. Analyze User-Visible Behavior and Inspect Target UI Components

Identify how an end user perceives and interacts with the feature before writing any E2E code.

**Constraints:**

- You MUST read the target React component(s) under `webapp/src/components/` or `webapp/app/` to verify semantic HTML roles, accessible labels (`aria-label`, `<label>`), and placeholders.
- You MUST test user-visible behavior (what is rendered and interactive to the user), NOT internal implementation details, state variable names, or CSS utility classes.
- You MUST ensure each planned test case is completely isolated and can run independently in any order.

### 2. Create or Extend Page Object Models (`webapp/e2e/pages/*Page.ts`)

Encapsulate all element locators and user interaction methods inside a dedicated Page Object class under `webapp/e2e/pages/`.

**Constraints:**

- You MUST define all locators as `readonly` properties initialized in the Page Object `constructor(page: Page)` or via typed locator factory methods on the Page Object.
- You MUST prioritize user-facing locators in the following order:
  1. `page.getByRole(...)` (with accessible `name`)
  2. `page.getByLabel(...)`
  3. `page.getByPlaceholder(...)`
  4. `page.getByText(...)`
- You MUST NOT use fragile CSS class selectors (`.btn`, `.bg-slate-900`), raw ID selectors (`#input`), or XPath (`//div`) in `.locator(...)`. The only permitted exception is semantic HTML elements that lack ARIA role mapping in browsers (such as `datalist#<id>` and `datalist#<id> option`).
- You MUST NOT call `expect(...)` inside any Page Object class under `webapp/e2e/pages/` (enforced by `playwright-best-practices/no-assertions-in-pom`). Page Objects MUST expose locators or action methods and leave assertions to `.spec.ts`.
- You MUST NOT use legacy ElementHandle APIs (`page.$`, `page.$$`, `page.$eval`, `locator.elementHandle`) or `{ force: true }` action options.
- You MUST NOT use hardcoded sleeps (`page.waitForTimeout()`).

### 3. Register Page Objects in Custom Fixtures (`webapp/e2e/fixtures/test.ts`)

Expose new Page Objects through Playwright's `test.extend` fixture mechanism so test files do not manually instantiate classes with `new`.

**Constraints:**

- You MUST register any newly created Page Object in `webapp/e2e/fixtures/test.ts` under `E2EFixtures`.
- You SHOULD keep fixture initialization lightweight (instantiate the Page Object and pass it to `await use(new XxxPage(page))`).

### 4. Write Isolated Spec Tests (`webapp/e2e/*.spec.ts`)

Author the test scenarios in `webapp/e2e/<feature>.spec.ts` using the injected Page Object fixtures and Web-First Assertions.

**Constraints:**

- You MUST import `{ test, expect }` from `./fixtures/test` (enforced by `playwright-best-practices/require-custom-fixture-import`). You MUST NOT import runtime `test` or `expect` directly from `@playwright/test` in `.spec.ts` files.
- You MUST NOT call `page.locator()`, `page.getByRole()`, `page.getByText()`, `page.getByLabel()`, `page.getByPlaceholder()`, `page.getByTestId()`, or `page.goto()` directly inside `.spec.ts` files (enforced by `playwright-best-practices/no-direct-locators-in-spec`). Always use Page Object properties and methods.
- You MUST use Playwright's auto-retrying Web-First Assertions (`await expect(locator).toBeVisible()`, `await expect(locator).toHaveValue()`, `await expect(locator).toHaveCount()`, `await expect(page).toHaveURL()`, etc.).
- You MUST NOT manually `await` state extractors inside `expect(...)` (e.g., `expect(await locator.isVisible()).toBe(true)` or `expect(await locator.inputValue()).toBe(...)` is strictly forbidden by `playwright-best-practices/prefer-web-first-assertions`).
- You MUST `await` (or `return`) every asynchronous Playwright `expect(...)` call (enforced by `playwright-best-practices/missing-playwright-await`).
- You MUST write both `test.describe(...)` and `test(...)` titles in **Japanese** describing user-visible behavior. English-only test titles and temporary test case ID prefixes (`TC-*`, `E2E-*`, etc.) are strictly forbidden.
- You MUST NOT commit `test.only`, `test.skip`, or `page.pause()`.
- You MUST isolate external network dependencies (such as authentication session or Instagram API calls) per test using `page.route(...)` or dedicated fixtures so tests never depend on shared mutable state or live third-party rate limits.

### 5. Execute Static Analysis and Self-Review SOP

Verify the authored E2E code against mechanical linters, type checks, and the self-review SOP.

**Constraints:**

- You MUST run `pnpm lint` and `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` and confirm 0 errors and 0 warnings.
- You MUST execute the `playwright-e2e-self-review` SOP before marking the E2E implementation task complete.

## Examples

### Good Example (Compliant with POM + Fixtures + Web-First Assertions)

```typescript
// webapp/e2e/pages/TopLoginPage.ts
import type { Locator, Page } from "@playwright/test";

export class TopLoginPage {
  readonly page: Page;
  readonly ssoLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ssoLoginButton = page.getByRole("button", { name: "Instagramでログイン" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }
}

// webapp/e2e/sso-button.spec.ts
import { expect, test } from "./fixtures/test";

test.describe("TOPページ（未ログイン時）", () => {
  test("Instagram SSO ログインボタンが表示される", async ({ topLoginPage }) => {
    await topLoginPage.goto();
    await expect(topLoginPage.ssoLoginButton).toBeVisible();
  });
});
```

### Bad Example (Rejected by Oxlint Static Analysis)

```typescript
// ❌ Forbidden import from @playwright/test in .spec.ts
import { expect, test } from "@playwright/test";

test("Bad E2E test", async ({ page }) => {
  // ❌ Forbidden direct page.goto() in .spec.ts
  await page.goto("/");
  // ❌ Forbidden hardcoded timeout
  await page.waitForTimeout(1000);
  // ❌ Forbidden direct locator in .spec.ts & non-web-first assertion
  expect(await page.getByRole("button").isVisible()).toBe(true);
});
```

## Troubleshooting

- **Error `playwright-best-practices(no-direct-locators-in-spec)`**:
  Move the `page.getBy*()` / `page.locator()` / `page.goto()` call into the appropriate Page Object class in `webapp/e2e/pages/` and reference the Page Object property/method in `.spec.ts`.
- **Error `playwright-best-practices(require-custom-fixture-import)`**:
  Replace `import { expect, test } from "@playwright/test"` with `import { expect, test } from "./fixtures/test"` in your `.spec.ts` file.
- **Error `playwright-best-practices(prefer-web-first-assertions)`**:
  Replace `expect(await locator.inputValue()).toBe("foo")` with `await expect(locator).toHaveValue("foo")`.
- **Error `playwright-best-practices(no-assertions-in-pom)`**:
  Remove `expect(...)` from `webapp/e2e/pages/*Page.ts` and move the assertion to the calling `.spec.ts` test block.
