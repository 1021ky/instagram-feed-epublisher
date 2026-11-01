/**
 * @file Playwright E2E カスタム Fixture 定義。
 *
 * すべての `.spec.ts` ファイルは `@playwright/test` ではなく本ファイルから
 * `{ test, expect }` をインポートし、Page Object およびテスト単位ネットワーク制御を
 * Fixture 経由で受け取ります。
 */
import { test as base, expect } from "@playwright/test";
import { FeedFilterPage } from "../pages/FeedFilterPage";
import { TopLoginPage } from "../pages/TopLoginPage";

export type HeldRequestGate = {
  /** リクエストがサーバーへ到達した時点で解決される Promise */
  arrived: Promise<void>;
  /** 保留中のリクエストを解放して実 BFF / OpenAPI モックサーバーへ通過させる関数 */
  release: () => void;
};

export type HashtagApiMockController = {
  /**
   * `/api/instagram/hashtags` リクエストを一時保留し、ローディング表示の検証後に
   * 実 BFF サーバーへそのまま通過させるゲートを作成します（ハードコード待機ゼロ）。
   */
  holdHashtagRequest: () => Promise<HeldRequestGate>;
  /**
   * `/api/instagram/hashtags` が候補 0 件を返すシナリオをこのテストコンテキストに注入します。
   */
  mockEmptySuggestions: () => Promise<void>;
  /**
   * `/api/instagram/hashtags` が 502 エラーを返す異常系シナリオをこのテストコンテキストに注入します。
   */
  mockServerError: () => Promise<void>;
};

export type E2EFixtures = {
  topLoginPage: TopLoginPage;
  feedFilterPage: FeedFilterPage;
  hashtagApiMock: HashtagApiMockController;
};

export const test = base.extend<E2EFixtures>({
  topLoginPage: async ({ page }, use) => {
    await use(new TopLoginPage(page));
  },
  feedFilterPage: async ({ page }, use) => {
    await use(new FeedFilterPage(page));
  },
  hashtagApiMock: async ({ page }, use) => {
    const controller: HashtagApiMockController = {
      holdHashtagRequest: async () => {
        let markArrived!: () => void;
        let releaseGate!: () => void;

        const arrived = new Promise<void>((resolve) => {
          markArrived = resolve;
        });
        const gate = new Promise<void>((resolve) => {
          releaseGate = resolve;
        });

        await page.route("**/api/instagram/hashtags*", async (route) => {
          markArrived();
          await gate;
          await route.continue();
        });

        return {
          arrived,
          release: () => releaseGate(),
        };
      },
      mockEmptySuggestions: async () => {
        await page.route("**/api/instagram/hashtags*", async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ hashtags: [], scannedPosts: 0 }),
          });
        });
      },
      mockServerError: async () => {
        await page.route("**/api/instagram/hashtags*", async (route) => {
          await route.fulfill({
            status: 502,
            contentType: "application/json",
            body: JSON.stringify({ error: "Upstream Graph API temporary failure" }),
          });
        });
      },
    };

    await use(controller);
  },
});

export { expect };
