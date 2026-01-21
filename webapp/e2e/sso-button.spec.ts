/**
 * @file E2E test for SSO login button visibility.
 */
import { expect, test } from "@playwright/test";

test("Instagram SSO button is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Instagramでログイン" })).toBeVisible();
});
