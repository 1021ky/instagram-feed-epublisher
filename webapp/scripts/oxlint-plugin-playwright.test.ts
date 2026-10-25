/**
 * @file Unit tests for Playwright Best Practices & POM Oxlint plugin (`oxlint-plugin-playwright.mjs`).
 */
import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { rules } from "./oxlint-plugin-playwright.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: {
      lang: "ts",
    },
  },
});

ruleTester.run("no-wait-for-timeout", rules["no-wait-for-timeout"], {
  valid: [
    "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
    "await page.waitForLoadState('networkidle');",
  ],
  invalid: [
    {
      code: "await page.waitForTimeout(1000);",
      errors: [{ message: /Hardcoded sleep `waitForTimeout\(\)` is forbidden/ }],
    },
    {
      code: "await this.page.waitForTimeout(500);",
      errors: [{ message: /Hardcoded sleep `waitForTimeout\(\)` is forbidden/ }],
    },
  ],
});

ruleTester.run("no-force-option", rules["no-force-option"], {
  valid: [
    "await button.click();",
    "await button.click({ force: false });",
    "await input.fill('hello');",
  ],
  invalid: [
    {
      code: "await button.click({ force: true });",
      errors: [{ message: /Bypassing actionability checks with `\{ force: true \}`/ }],
    },
    {
      code: "await checkbox.check({ force: true });",
      errors: [{ message: /Bypassing actionability checks with `\{ force: true \}`/ }],
    },
  ],
});

ruleTester.run("no-element-handle", rules["no-element-handle"], {
  valid: [
    "const button = page.getByRole('button', { name: 'Login' });",
    "const items = page.getByRole('listitem');",
  ],
  invalid: [
    {
      code: "const el = await page.$('.btn');",
      errors: [{ message: /Legacy ElementHandle API `\.\$\(\)` is forbidden/ }],
    },
    {
      code: "const els = await page.$$('button');",
      errors: [{ message: /Legacy ElementHandle API `\.\$\$\(\)` is forbidden/ }],
    },
    {
      code: "const handle = await locator.elementHandle();",
      errors: [{ message: /Legacy ElementHandle API `\.elementHandle\(\)` is forbidden/ }],
    },
  ],
});

ruleTester.run("no-page-pause", rules["no-page-pause"], {
  valid: ["await topLoginPage.goto();"],
  invalid: [
    {
      code: "await page.pause();",
      errors: [{ message: /Debugging call `\.pause\(\)` must not be committed/ }],
    },
  ],
});

ruleTester.run("prefer-web-first-assertions", rules["prefer-web-first-assertions"], {
  valid: [
    "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
    "await expect(feedFilterPage.hashtagInput).toHaveValue('京都');",
    "await expect(page).toHaveURL('/?scroll=filters');",
  ],
  invalid: [
    {
      code: "expect(await topLoginPage.ssoLoginButton.isVisible()).toBe(true);",
      errors: [{ message: /Do not manually `await \.isVisible\(\)` inside `expect\(\)`/ }],
    },
    {
      code: "expect(await feedFilterPage.hashtagInput.inputValue()).toBe('京都');",
      errors: [{ message: /Do not manually `await \.inputValue\(\)` inside `expect\(\)`/ }],
    },
    {
      code: "expect(page.url()).toContain('/privacy');",
      errors: [{ message: /Do not pass `page\.url\(\)` to `expect\(\)`/ }],
    },
  ],
});

ruleTester.run("missing-playwright-await", rules["missing-playwright-await"], {
  valid: [
    "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
    "await expect(topLoginPage.ssoLoginButton).not.toBeVisible();",
    "await expect.soft(feedFilterPage.hashtagInput).toHaveValue('travel');",
    "return expect(topLoginPage.ssoLoginButton).toBeVisible();",
    "await Promise.all([expect(topLoginPage.ssoLoginButton).toBeVisible()]);",
    "expect(1 + 1).toBe(2);",
  ],
  invalid: [
    {
      code: "expect(topLoginPage.ssoLoginButton).toBeVisible();",
      errors: [{ message: /Async Playwright assertion `\.toBeVisible\(\)` must be awaited/ }],
    },
    {
      code: "expect(feedFilterPage.hashtagInput).not.toHaveValue('x');",
      errors: [{ message: /Async Playwright assertion `\.toHaveValue\(\)` must be awaited/ }],
    },
  ],
});

ruleTester.run("no-direct-locators-in-spec", rules["no-direct-locators-in-spec"], {
  valid: [
    "await topLoginPage.goto();",
    "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
    "await feedFilterPage.selectHashtagChip('京都');",
  ],
  invalid: [
    {
      code: "await page.goto('/');",
      errors: [{ message: /Direct call to `\.goto\(\)` is forbidden in `\.spec\.ts` files/ }],
    },
    {
      code: "await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();",
      errors: [{ message: /Direct call to `\.getByRole\(\)` is forbidden in `\.spec\.ts` files/ }],
    },
    {
      code: "const el = page.locator('#hashtag');",
      errors: [{ message: /Direct call to `\.locator\(\)` is forbidden in `\.spec\.ts` files/ }],
    },
  ],
});

ruleTester.run("require-custom-fixture-import", rules["require-custom-fixture-import"], {
  valid: [
    "import { expect, test } from './fixtures/test';",
    "import type { Page } from '@playwright/test';",
    "import { type Locator } from '@playwright/test';",
  ],
  invalid: [
    {
      code: "import { expect, test } from '@playwright/test';",
      errors: [
        { message: /In `\.spec\.ts` files, import `\{ test, expect \}` from `\.\/fixtures\/test`/ },
      ],
    },
  ],
});

ruleTester.run("no-assertions-in-pom", rules["no-assertions-in-pom"], {
  valid: [
    `export class TopLoginPage {
      async clickLogin() {
        await this.ssoLoginButton.click();
      }
    }`,
  ],
  invalid: [
    {
      code: `export class TopLoginPage {
        async verifyVisible() {
          await expect(this.ssoLoginButton).toBeVisible();
        }
      }`,
      errors: [{ message: /Assertions \(`expect\(\)`\) are forbidden inside Page Object classes/ }],
    },
  ],
});

ruleTester.run("prefer-user-facing-locators", rules["prefer-user-facing-locators"], {
  valid: [
    "this.ssoLoginButton = page.getByRole('button', { name: 'Instagramでログイン' });",
    "this.hashtagInput = page.getByLabel('ハッシュタグ絞り込み');",
    "this.datalistOptions = page.locator('datalist#hashtag-suggestions option');",
  ],
  invalid: [
    {
      code: "this.button = page.locator('.btn-primary');",
      errors: [{ message: /Fragile selector "\.btn-primary" in `\.locator\(\)` is forbidden/ }],
    },
    {
      code: "this.input = page.locator('#hashtag-input');",
      errors: [{ message: /Fragile selector "#hashtag-input" in `\.locator\(\)` is forbidden/ }],
    },
    {
      code: "this.item = page.locator('//div[@class=\"card\"]');",
      errors: [
        { message: /Fragile selector "\/\/div\[@class="card"\]" in `\.locator\(\)` is forbidden/ },
      ],
    },
  ],
});
