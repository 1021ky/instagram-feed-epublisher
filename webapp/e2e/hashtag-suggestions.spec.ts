/**
 * @file Issue #35: ハッシュタグ自動補完・クイック選択機能の E2E テスト。
 *
 * Option A（OpenAPI 3.1 モックサーバー + Next.js BFF 貫通 + 異常系のみ `page.route` 分離）に基づき、
 * Agent-SOP (`playwright-e2e-authoring`) および Oxlint 静的解析ルールに完全準拠して実装しています。
 */
import { expect, test } from "./fixtures/test";

test.describe("Step 1: ハッシュタグ自動補完・クイック選択機能", () => {
  test("ログイン後に直近投稿のハッシュタグ候補が集計表示され、チップの選択・解除と絞り込み取得が一気通貫で動作する", async ({
    topLoginPage,
    feedFilterPage,
  }) => {
    await topLoginPage.goto();
    await topLoginPage.loginWithInstagram();

    await expect(feedFilterPage.filterSection).toBeVisible();
    await expect(feedFilterPage.hashtagChipGroup).toBeVisible();

    // OpenAPI モックサーバーの 8 件の投稿から 6 種類の有効タグ（URL内 #ignore は除外）が集計されること
    await expect(feedFilterPage.hashtagDatalistOptions).toHaveCount(6);
    await expect(feedFilterPage.hashtagChipButtons).toHaveCount(6);

    const topChip = feedFilterPage.getHashtagChipButton("100日チャレンジ");
    const kyotoChip = feedFilterPage.getHashtagChipButton("京都カフェ");
    await expect(topChip).toHaveText("#100日チャレンジ(4)");
    await expect(kyotoChip).toHaveText("#京都カフェ(3)");
    await expect(kyotoChip).toHaveAttribute("aria-pressed", "false");

    // チップをクリックすると入力欄にタグがセットされ、aria-pressed="true" になること
    await feedFilterPage.selectHashtagChip("京都カフェ");
    await expect(feedFilterPage.hashtagInput).toHaveValue("京都カフェ");
    await expect(kyotoChip).toHaveAttribute("aria-pressed", "true");

    // 選択中のチップを再クリックすると選択解除（空欄）に戻ること
    await feedFilterPage.selectHashtagChip("京都カフェ");
    await expect(feedFilterPage.hashtagInput).toHaveValue("");
    await expect(kyotoChip).toHaveAttribute("aria-pressed", "false");

    // 再度「京都カフェ」を選択して投稿取得を実行すると、BFF -> OpenAPI モックサーバー経由で 3 件取得されること
    await feedFilterPage.selectHashtagChip("京都カフェ");
    await feedFilterPage.submitFilter();

    await expect(feedFilterPage.filterSummarySection).toContainText("#京都カフェ");
    await expect(feedFilterPage.filterSummarySection).toContainText("3件取得中");
    await expect(feedFilterPage.postListSection).toContainText("選択中: 3 / 3 件");
  });

  test("ハッシュタグ候補の集計リクエスト中はローディング表示が出て、完了後にチップへ切り替わる", async ({
    topLoginPage,
    feedFilterPage,
    hashtagApiMock,
  }) => {
    const heldRequest = await hashtagApiMock.holdHashtagRequest();

    await topLoginPage.goto();
    await topLoginPage.loginWithInstagram();

    await heldRequest.arrived;
    await expect(feedFilterPage.hashtagLoadingStatus).toBeVisible();

    heldRequest.release();

    await expect(feedFilterPage.hashtagLoadingStatus).toBeHidden();
    await expect(feedFilterPage.getHashtagChipButton("100日チャレンジ")).toBeVisible();
  });

  test("ハッシュタグ候補が 0 件の場合、クイック選択チップ領域を表示せず手入力に支障がない", async ({
    topLoginPage,
    feedFilterPage,
    hashtagApiMock,
  }) => {
    await hashtagApiMock.mockEmptySuggestions();

    await topLoginPage.goto();
    await topLoginPage.loginWithInstagram();

    await expect(feedFilterPage.filterSection).toBeVisible();
    await expect(feedFilterPage.hashtagDatalistOptions).toHaveCount(0);
    await expect(feedFilterPage.hashtagChipGroup).toBeHidden();

    await feedFilterPage.fillHashtag("朝活");
    await expect(feedFilterPage.hashtagInput).toHaveValue("朝活");
  });

  test("ハッシュタグ候補 API がエラー(502)を返しても画面全体のエラーバナーを出さず、手入力でのフィード取得をブロックしない", async ({
    topLoginPage,
    feedFilterPage,
    hashtagApiMock,
  }) => {
    await hashtagApiMock.mockServerError();

    await topLoginPage.goto();
    await topLoginPage.loginWithInstagram();

    await expect(feedFilterPage.filterSection).toBeVisible();
    await expect(feedFilterPage.pageAlertBanner).toBeHidden();
    await expect(feedFilterPage.hashtagChipGroup).toBeHidden();

    // 手入力で「読書記録」を指定し、通常通り投稿取得（2件）が成功すること
    await feedFilterPage.fillHashtag("読書記録");
    await feedFilterPage.submitFilter();

    await expect(feedFilterPage.filterSummarySection).toContainText("#読書記録");
    await expect(feedFilterPage.filterSummarySection).toContainText("2件取得中");
  });

  test("デモ体験モードではサンプル投稿から集計されたハッシュタグチップが表示され、クリック時にデモ制限案内が表示される", async ({
    topLoginPage,
    feedFilterPage,
  }) => {
    await topLoginPage.goto();
    await topLoginPage.startDemoMode();

    await expect(feedFilterPage.filterSection).toBeVisible();
    const challengeChip = feedFilterPage.getHashtagChipButton("100日チャレンジ");
    const demoChip = feedFilterPage.getHashtagChipButton("demo");

    await expect(challengeChip).toBeVisible();
    await expect(challengeChip).toHaveAttribute("aria-pressed", "true");
    await expect(demoChip).toBeVisible();
    await expect(demoChip).toHaveAttribute("aria-pressed", "false");

    // デモ体験中に別チップをクリックしても条件は変わらず、デモ制限案内が表示されること
    await feedFilterPage.selectHashtagChip("demo");
    await expect(feedFilterPage.demoBlockedNotice).toBeVisible();
    await expect(feedFilterPage.hashtagInput).toHaveValue("100日チャレンジ");
  });
});
