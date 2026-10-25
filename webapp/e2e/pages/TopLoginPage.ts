/**
 * @file TOPページ（未ログイン時ログインカード）の Page Object Model。
 *
 * Playwright 公式ベストプラクティス（https://playwright.dev/docs/pom）に準拠し、
 * User-Facing ロケータと画面操作メソッドのみをカプセル化します（アサーションは .spec.ts 側に配置）。
 */
import type { Locator, Page } from "@playwright/test";

export class TopLoginPage {
  readonly page: Page;
  readonly ssoLoginButton: Locator;
  readonly demoModeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ssoLoginButton = page.getByRole("button", { name: "Instagramでログイン" });
    this.demoModeButton = page.getByRole("button", { name: /デモを体験/ });
  }

  /**
   * TOPページへ遷移します。
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Instagram SSO ログインを実行します（E2E ではローカル OpenAPI モックサーバー経由で完結）。
   */
  async loginWithInstagram(): Promise<void> {
    await this.ssoLoginButton.click();
  }

  /**
   * デモ体験モードを開始します。
   */
  async startDemoMode(): Promise<void> {
    await this.demoModeButton.click();
  }
}
