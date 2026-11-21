/**
 * @file E2E test for SSO login button visibility using Page Object Model (POM) fixtures.
 */
import { expect, test } from "./fixtures/test";

test.describe("TOPページ（未ログイン時）", () => {
  test("Instagram SSO ログインボタンが表示される", async ({ topLoginPage }) => {
    await topLoginPage.goto();
    await expect(topLoginPage.ssoLoginButton).toBeVisible();
  });
});
