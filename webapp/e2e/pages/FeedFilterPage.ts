/**
 * @file Step 1: フィード絞り込みフォームおよび関連領域の Page Object Model。
 *
 * ハッシュタグ入力欄、`<datalist>` 候補、クイック選択チップ、ローディング状態、
 * デモ体験案内バナー、フィード取得実行ボタンの User-Facing ロケータと操作メソッドを提供します。
 */
import type { Locator, Page } from "@playwright/test";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class FeedFilterPage {
  readonly page: Page;
  readonly filterSection: Locator;
  readonly filterSummarySection: Locator;
  readonly hashtagInput: Locator;
  readonly hashtagDatalist: Locator;
  readonly hashtagDatalistOptions: Locator;
  readonly hashtagChipGroup: Locator;
  readonly hashtagChipButtons: Locator;
  readonly hashtagLoadingStatus: Locator;
  readonly demoBlockedNotice: Locator;
  readonly pageAlertBanner: Locator;
  readonly postListSection: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterSection = page.getByRole("region", { name: "フィード絞り込みフォーム" });
    this.filterSummarySection = page.getByRole("region", { name: "フィード絞り込み条件サマリー" });
    this.hashtagInput = page.getByLabel(/ハッシュタグ絞り込み/);
    this.hashtagDatalist = page.locator("datalist#hashtag-suggestions");
    this.hashtagDatalistOptions = page.locator("datalist#hashtag-suggestions option");
    this.hashtagChipGroup = this.filterSection.getByRole("group", {
      name: "よく使うハッシュタグ",
    });
    this.hashtagChipButtons = this.hashtagChipGroup.getByRole("button");
    this.hashtagLoadingStatus = this.filterSection
      .getByRole("status")
      .filter({ hasText: "よく使うハッシュタグを集計中..." });
    this.demoBlockedNotice = this.filterSection
      .getByRole("status")
      .filter({ hasText: "デモ体験中は条件を変更できません" });
    // Next.js App Router の空の `#__next-route-announcer__` (role="alert") と区別するためエラー記号で絞り込む
    this.pageAlertBanner = page.getByRole("alert").filter({ hasText: "✕" });
    this.postListSection = page.getByRole("region", { name: "投稿確認・選択リスト" });
    this.submitButton = this.filterSection.getByRole("button", { name: "この条件で投稿を取得" });
  }

  /**
   * ページへ遷移します。
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * ハッシュタグ入力欄にフォーカスします。
   */
  async focusHashtagInput(): Promise<void> {
    await this.hashtagInput.focus();
  }

  /**
   * ハッシュタグ入力欄へテキストを入力します。
   */
  async fillHashtag(tag: string): Promise<void> {
    await this.hashtagInput.fill(tag);
  }

  /**
   * 指定したハッシュタグ名のクイック選択チップボタンの Locator を返します。
   */
  getHashtagChipButton(tagName: string): Locator {
    const normalized = tagName.replace(/^[#＃]/, "");
    return this.hashtagChipGroup.getByRole("button", {
      name: new RegExp(`^#${escapeRegExp(normalized)}\\s*\\(\\d+\\)`),
    });
  }

  /**
   * 指定したハッシュタグのクイック選択チップをクリックします。
   */
  async selectHashtagChip(tagName: string): Promise<void> {
    await this.getHashtagChipButton(tagName).click();
  }

  /**
   * 現在の条件で投稿取得を実行します。
   */
  async submitFilter(): Promise<void> {
    await this.submitButton.click();
  }
}
