/**
 * @file Step 2 の並び順変更（デフォルト古い順）およびカルーセル画像選択の E2E テスト。
 */
import { expect, test } from "./fixtures/test";

test.describe("Step 2: 並び順変更とカルーセル画像選択", () => {
  test("デモ体験モードではデフォルトで古い順に並び、新しい順への切り替えで表示順序が反転すること", async ({
    topLoginPage,
    postListPage,
  }) => {
    await topLoginPage.goto();
    await topLoginPage.startDemoMode();

    await expect(postListPage.sortAscButton).toHaveAttribute("aria-pressed", "true");
    await expect(postListPage.sortDescButton).toHaveAttribute("aria-pressed", "false");
    await expect(postListPage.firstPostCard).toContainText("Day 1 の記録です。");

    await postListPage.selectNewestFirst();

    await expect(postListPage.sortAscButton).toHaveAttribute("aria-pressed", "false");
    await expect(postListPage.sortDescButton).toHaveAttribute("aria-pressed", "true");
    await expect(postListPage.firstPostCard).toContainText("Day 100 の記録です。");

    await postListPage.selectOldestFirst();
    await expect(postListPage.firstPostCard).toContainText("Day 1 の記録です。");
  });

  test("デモ体験モードのカルーセル投稿で複数枚の写真を選択・除外できること", async ({
    topLoginPage,
    postListPage,
  }) => {
    await topLoginPage.goto();
    await topLoginPage.startDemoMode();

    await expect(postListPage.carouselCountLabel.first()).toContainText("3/3枚");
    const secondPhoto = postListPage.getCarouselChildCheckbox(2);
    await expect(secondPhoto).toHaveAttribute("aria-checked", "true");

    await postListPage.toggleCarouselChild(2);

    await expect(secondPhoto).toHaveAttribute("aria-checked", "false");
    await expect(postListPage.carouselCountLabel.first()).toContainText("2/3枚");
  });

  test("ログイン後の実フィード取得でもデフォルト古い順で表示され、カルーセル投稿が選択できること", async ({
    topLoginPage,
    feedFilterPage,
    postListPage,
  }) => {
    await topLoginPage.goto();
    await topLoginPage.loginWithInstagram();

    await feedFilterPage.selectHashtagChip("京都カフェ");
    await feedFilterPage.submitFilter();

    // 京都カフェの 3 件のうち、最も古い「週末のカフェ巡り」(4日前) が先頭、続いて「鴨川沿いを散歩しました」(3日前・カルーセル) が並ぶ
    await expect(postListPage.sortAscButton).toHaveAttribute("aria-pressed", "true");
    await expect(postListPage.firstPostCard).toContainText("週末のカフェ巡り");
    await expect(postListPage.carouselCountLabel.first()).toContainText("3/3枚");

    await postListPage.selectNewestFirst();
    await expect(postListPage.firstPostCard).toContainText("お気に入りの抹茶ラテ");
  });
});
