/**
 * @file Playwright ベストプラクティス・POM 構造強制 Oxlint プラグインの単体テスト
 */
import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { rules } from "./oxlint-plugin-playwright.mjs";

RuleTester.describe = ((text: string, fn: () => void) => {
  const label =
    text === "valid"
      ? "正常系（許可されるコード）"
      : text === "invalid"
        ? "異常系（違反として検出されるコード）"
        : text;
  return describe(label, fn);
}) as typeof RuleTester.describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: {
      lang: "ts",
    },
  },
});

describe("Playwright ベストプラクティス Oxlint プラグイン", () => {
  ruleTester.run("ハードコード待機禁止ルール (no-wait-for-timeout)", rules["no-wait-for-timeout"], {
    valid: [
      {
        name: "Web-First アサーションによる表示待機を許可する",
        code: "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
      },
      {
        name: "ロード状態待機 (waitForLoadState) を許可する",
        code: "await page.waitForLoadState('networkidle');",
      },
    ],
    invalid: [
      {
        name: "page.waitForTimeout() の直接呼び出しを禁止する",
        code: "await page.waitForTimeout(1000);",
        errors: [{ message: /Hardcoded sleep `waitForTimeout\(\)` is forbidden/ }],
      },
      {
        name: "Page Object 内での this.page.waitForTimeout() 呼び出しを禁止する",
        code: "await this.page.waitForTimeout(500);",
        errors: [{ message: /Hardcoded sleep `waitForTimeout\(\)` is forbidden/ }],
      },
    ],
  });

  ruleTester.run("強制アクション回避禁止ルール (no-force-option)", rules["no-force-option"], {
    valid: [
      {
        name: "オプションなしの click() を許可する",
        code: "await button.click();",
      },
      {
        name: "force: false 明示指定の click() を許可する",
        code: "await button.click({ force: false });",
      },
      {
        name: "通常の fill() 入力を許可する",
        code: "await input.fill('hello');",
      },
    ],
    invalid: [
      {
        name: "click({ force: true }) による操作可能性チェック回避を禁止する",
        code: "await button.click({ force: true });",
        errors: [{ message: /Bypassing actionability checks with `\{ force: true \}`/ }],
      },
      {
        name: "check({ force: true }) による操作可能性チェック回避を禁止する",
        code: "await checkbox.check({ force: true });",
        errors: [{ message: /Bypassing actionability checks with `\{ force: true \}`/ }],
      },
    ],
  });

  ruleTester.run(
    "レガシー ElementHandle API 禁止ルール (no-element-handle)",
    rules["no-element-handle"],
    {
      valid: [
        {
          name: "getByRole による Locator 取得を許可する",
          code: "const button = page.getByRole('button', { name: 'Login' });",
        },
        {
          name: "複数要素に対する getByRole を許可する",
          code: "const items = page.getByRole('listitem');",
        },
      ],
      invalid: [
        {
          name: "page.$() の使用を禁止する",
          code: "const el = await page.$('.btn');",
          errors: [{ message: /Legacy ElementHandle API `\.\$\(\)` is forbidden/ }],
        },
        {
          name: "page.$$() の使用を禁止する",
          code: "const els = await page.$$('button');",
          errors: [{ message: /Legacy ElementHandle API `\.\$\$\(\)` is forbidden/ }],
        },
        {
          name: "locator.elementHandle() の使用を禁止する",
          code: "const handle = await locator.elementHandle();",
          errors: [{ message: /Legacy ElementHandle API `\.elementHandle\(\)` is forbidden/ }],
        },
      ],
    },
  );

  ruleTester.run("デバッグ一時停止残存禁止ルール (no-page-pause)", rules["no-page-pause"], {
    valid: [
      {
        name: "通常のページ遷移メソッド呼び出しを許可する",
        code: "await topLoginPage.goto();",
      },
    ],
    invalid: [
      {
        name: "page.pause() のコミット残存を禁止する",
        code: "await page.pause();",
        errors: [{ message: /Debugging call `\.pause\(\)` must not be committed/ }],
      },
    ],
  });

  ruleTester.run(
    "Web-First アサーション強制ルール (prefer-web-first-assertions)",
    rules["prefer-web-first-assertions"],
    {
      valid: [
        {
          name: "toBeVisible() による自動リトライアサーションを許可する",
          code: "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
        },
        {
          name: "toHaveValue() による自動リトライアサーションを許可する",
          code: "await expect(feedFilterPage.hashtagInput).toHaveValue('京都');",
        },
        {
          name: "toHaveURL() による URL アサーションを許可する",
          code: "await expect(page).toHaveURL('/?scroll=filters');",
        },
      ],
      invalid: [
        {
          name: "expect 内で await locator.isVisible() を手動評価することを禁止する",
          code: "expect(await topLoginPage.ssoLoginButton.isVisible()).toBe(true);",
          errors: [{ message: /Do not manually `await \.isVisible\(\)` inside `expect\(\)`/ }],
        },
        {
          name: "expect 内で await locator.inputValue() を手動評価することを禁止する",
          code: "expect(await feedFilterPage.hashtagInput.inputValue()).toBe('京都');",
          errors: [{ message: /Do not manually `await \.inputValue\(\)` inside `expect\(\)`/ }],
        },
        {
          name: "expect に同期的な page.url() を渡すことを禁止する",
          code: "expect(page.url()).toContain('/privacy');",
          errors: [{ message: /Do not pass `page\.url\(\)` to `expect\(\)`/ }],
        },
      ],
    },
  );

  ruleTester.run(
    "非同期アサーション await 漏れ防止ルール (missing-playwright-await)",
    rules["missing-playwright-await"],
    {
      valid: [
        {
          name: "await 付き toBeVisible() を許可する",
          code: "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
        },
        {
          name: "await 付き not.toBeVisible() を許可する",
          code: "await expect(topLoginPage.ssoLoginButton).not.toBeVisible();",
        },
        {
          name: "await 付き expect.soft().toHaveValue() を許可する",
          code: "await expect.soft(feedFilterPage.hashtagInput).toHaveValue('travel');",
        },
        {
          name: "Promise を return する非同期アサーションを許可する",
          code: "return expect(topLoginPage.ssoLoginButton).toBeVisible();",
        },
        {
          name: "Promise.all 内に渡された非同期アサーションを許可する",
          code: "await Promise.all([expect(topLoginPage.ssoLoginButton).toBeVisible()]);",
        },
        {
          name: "同期マッチャー toBe() は await なしでも許可する",
          code: "expect(1 + 1).toBe(2);",
        },
      ],
      invalid: [
        {
          name: "await なしの expect(locator).toBeVisible() を検出する",
          code: "expect(topLoginPage.ssoLoginButton).toBeVisible();",
          errors: [{ message: /Async Playwright assertion `\.toBeVisible\(\)` must be awaited/ }],
        },
        {
          name: "await なしの expect(locator).not.toHaveValue() を検出する",
          code: "expect(feedFilterPage.hashtagInput).not.toHaveValue('x');",
          errors: [{ message: /Async Playwright assertion `\.toHaveValue\(\)` must be awaited/ }],
        },
      ],
    },
  );

  ruleTester.run(
    "spec ファイル内での直接ロケータ禁止ルール (no-direct-locators-in-spec)",
    rules["no-direct-locators-in-spec"],
    {
      valid: [
        {
          name: "Page Object の goto() メソッド呼び出しを許可する",
          code: "await topLoginPage.goto();",
        },
        {
          name: "Page Object の Locator プロパティに対する expect を許可する",
          code: "await expect(topLoginPage.ssoLoginButton).toBeVisible();",
        },
        {
          name: "Page Object のドメインアクションメソッド呼び出しを許可する",
          code: "await feedFilterPage.selectHashtagChip('京都');",
        },
      ],
      invalid: [
        {
          name: "spec ファイル内での直接 page.goto() 呼び出しを禁止する",
          code: "await page.goto('/');",
          errors: [{ message: /Direct call to `\.goto\(\)` is forbidden in `\.spec\.ts` files/ }],
        },
        {
          name: "spec ファイル内での直接 page.getByRole() 呼び出しを禁止する",
          code: "await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();",
          errors: [
            { message: /Direct call to `\.getByRole\(\)` is forbidden in `\.spec\.ts` files/ },
          ],
        },
        {
          name: "spec ファイル内での直接 page.locator() 呼び出しを禁止する",
          code: "const el = page.locator('#hashtag');",
          errors: [
            { message: /Direct call to `\.locator\(\)` is forbidden in `\.spec\.ts` files/ },
          ],
        },
      ],
    },
  );

  ruleTester.run(
    "カスタム Fixture インポート強制ルール (require-custom-fixture-import)",
    rules["require-custom-fixture-import"],
    {
      valid: [
        {
          name: "./fixtures/test からの test・expect インポートを許可する",
          code: "import { expect, test } from './fixtures/test';",
        },
        {
          name: "@playwright/test からの import type を許可する",
          code: "import type { Page } from '@playwright/test';",
        },
        {
          name: "@playwright/test からのインライン type インポートを許可する",
          code: "import { type Locator } from '@playwright/test';",
        },
      ],
      invalid: [
        {
          name: "@playwright/test からのランタイム test・expect 直接インポートを禁止する",
          code: "import { expect, test } from '@playwright/test';",
          errors: [
            {
              message:
                /In `\.spec\.ts` files, import `\{ test, expect \}` from `\.\/fixtures\/test`/,
            },
          ],
        },
      ],
    },
  );

  ruleTester.run(
    "Page Object 内アサーション禁止ルール (no-assertions-in-pom)",
    rules["no-assertions-in-pom"],
    {
      valid: [
        {
          name: "アサーションを含まない Page Object メソッドを許可する",
          code: `export class TopLoginPage {
      async clickLogin() {
        await this.ssoLoginButton.click();
      }
    }`,
        },
      ],
      invalid: [
        {
          name: "Page Object メソッド内での expect() 呼び出しを禁止する",
          code: `export class TopLoginPage {
        async verifyVisible() {
          await expect(this.ssoLoginButton).toBeVisible();
        }
      }`,
          errors: [
            { message: /Assertions \(`expect\(\)`\) are forbidden inside Page Object classes/ },
          ],
        },
      ],
    },
  );

  ruleTester.run(
    "ユーザー視点ロケータ優先ルール (prefer-user-facing-locators)",
    rules["prefer-user-facing-locators"],
    {
      valid: [
        {
          name: "getByRole によるボタン取得を許可する",
          code: "this.ssoLoginButton = page.getByRole('button', { name: 'Instagramでログイン' });",
        },
        {
          name: "getByLabel による入力欄取得を許可する",
          code: "this.hashtagInput = page.getByLabel('ハッシュタグ絞り込み');",
        },
        {
          name: "ARIA ロールを持たない datalist#id option へのセマンティックセレクタを許可する",
          code: "this.datalistOptions = page.locator('datalist#hashtag-suggestions option');",
        },
      ],
      invalid: [
        {
          name: "CSS クラスセレクタ (.btn-primary) の使用を禁止する",
          code: "this.button = page.locator('.btn-primary');",
          errors: [{ message: /Fragile selector "\.btn-primary" in `\.locator\(\)` is forbidden/ }],
        },
        {
          name: "生 ID セレクタ (#hashtag-input) の使用を禁止する",
          code: "this.input = page.locator('#hashtag-input');",
          errors: [
            { message: /Fragile selector "#hashtag-input" in `\.locator\(\)` is forbidden/ },
          ],
        },
        {
          name: "XPath セレクタ (//div) の使用を禁止する",
          code: "this.item = page.locator('//div[@class=\"card\"]');",
          errors: [
            {
              message:
                /Fragile selector "\/\/div\[@class="card"\]" in `\.locator\(\)` is forbidden/,
            },
          ],
        },
      ],
    },
  );
});
