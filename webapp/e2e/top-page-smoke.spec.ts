/**
 * @file TOPページ起動・初期レンダリングの健全性を検証するスモークテスト。
 *
 * アプリケーションが正常に起動し、TOPページアクセス時に HTTP 200 で応答すること、
 * ブラウザ側の未捕捉例外・コンソールエラー・Next.js エラー画面が発生せず、
 * 主要な UI コンポーネントが正常にマウントされることを実ブラウザ上で保証します。
 */
import { expect, test } from "./fixtures/test";

test.describe("TOPページ起動・健全性検証（スモークテスト）", () => {
  test("TOPページにアクセスした際、HTTP 200 で応答しエラー画面が表示されないこと", async ({
    topLoginPage,
    page,
  }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (err) => pageErrors.push(err));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const response = await topLoginPage.goto();
    expect(response?.status()).toBe(200);

    // 未捕捉のランタイムエラーやコンソールエラーが一切発生していないこと
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    // Next.js のエラーオーバーレイが表示されていないこと
    await expect(topLoginPage.errorOverlay).toHaveCount(0);
  });

  test("未ログイン時の主要コンポーネント（ブランドロゴ、見出し、ログインボタン、デモ体験ボタン、フッター）が正常に描画されること", async ({
    topLoginPage,
  }) => {
    await topLoginPage.goto();

    // ブランド情報・メイン見出しの表示確認
    await expect(topLoginPage.brandName).toBeVisible();
    await expect(topLoginPage.mainHeading).toBeVisible();

    // ログインカード内アクションボタンの表示確認
    await expect(topLoginPage.ssoLoginButton).toBeVisible();
    await expect(topLoginPage.demoModeButton).toBeVisible();

    // サイトフッターの表示確認
    await expect(topLoginPage.footer).toBeVisible();
  });
});
