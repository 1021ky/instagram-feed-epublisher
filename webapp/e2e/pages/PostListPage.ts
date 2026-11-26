/**
 * @file Step 2: 投稿確認・選択リストおよびカルーセル・並び順操作の Page Object Model。
 */
import type { Locator, Page } from "@playwright/test";

export class PostListPage {
  readonly page: Page;
  readonly section: Locator;
  readonly sortOrderGroup: Locator;
  readonly sortAscButton: Locator;
  readonly sortDescButton: Locator;
  readonly postCards: Locator;
  readonly carouselSelectionGroup: Locator;
  readonly carouselCountLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page.getByRole("region", { name: "投稿確認・選択リスト" });
    this.sortOrderGroup = this.section.getByRole("group", { name: "投稿の並び順" });
    this.sortAscButton = this.sortOrderGroup.getByRole("button", { name: "古い順（おすすめ）" });
    this.sortDescButton = this.sortOrderGroup.getByRole("button", { name: "新しい順" });
    this.postCards = this.section.getByRole("article");
    this.carouselSelectionGroup = this.section.getByRole("group", {
      name: "カルーセル画像の収録選択",
    });
    this.carouselCountLabel = this.section.getByText(/収録する写真を選択/);
  }

  /**
   * 表示されている先頭投稿の Locator を返します。
   */
  get firstPostCard(): Locator {
    return this.postCards.first();
  }

  /**
   * 並び順を「古い順（おすすめ）」に切り替えます。
   */
  async selectOldestFirst(): Promise<void> {
    await this.sortAscButton.click();
  }

  /**
   * 並び順を「新しい順」に切り替えます。
   */
  async selectNewestFirst(): Promise<void> {
    await this.sortDescButton.click();
  }

  /**
   * 先頭カルーセル内の指定番目（1始まり）の子画像チェックボックスを返します。
   */
  getCarouselChildCheckbox(indexOneBased: number): Locator {
    return this.carouselSelectionGroup
      .first()
      .getByRole("checkbox", { name: new RegExp(`^画像 ${indexOneBased} を`) });
  }

  /**
   * 先頭カルーセル内の指定番目（1始まり）の子画像選択を切り替えます。
   */
  async toggleCarouselChild(indexOneBased: number): Promise<void> {
    await this.getCarouselChildCheckbox(indexOneBased).click();
  }
}
