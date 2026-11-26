import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { FeedPostItem } from "@/types/ui";
import { PostListStep } from "./PostListStep";

const samplePosts: FeedPostItem[] = [
  {
    id: "p1",
    media_type: "IMAGE",
    media_url:
      "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E",
    permalink: "https://instagram.com/p/1",
    timestamp: "2026-09-18T10:00:00Z",
    caption: "Day 1: 京都カフェめぐり",
    like_count: 50,
    selected: true,
  },
  {
    id: "p2",
    media_type: "IMAGE",
    media_url:
      "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E",
    permalink: "https://instagram.com/p/2",
    timestamp: "2026-09-19T10:00:00Z",
    caption: "Day 2: 朝のランニング記録",
    like_count: 75,
    selected: false,
  },
];

describe("投稿確認・選択リストのブラウザ操作 (PostListStep)", () => {
  it("キャプション検索で絞り込みでき、44px 以上のクリアボタンで全件に戻せること", async () => {
    const screen = await render(
      <PostListStep
        posts={samplePosts}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    const searchInput = screen.getByLabelText("キャプション内キーワード検索");
    await searchInput.fill("京都カフェ");

    await expect.element(screen.getByText("該当: 1 件")).toBeVisible();
    await expect.element(screen.getByText("Day 1: 京都カフェめぐり")).toBeVisible();
    await expect.element(screen.getByText("Day 2: 朝のランニング記録")).not.toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: "検索キーワードをクリア" });
    const clearRect = clearButton.element().getBoundingClientRect();
    expect(clearRect.width).toBeGreaterThanOrEqual(44);
    expect(clearRect.height).toBeGreaterThanOrEqual(44);

    await clearButton.click();
    await expect.element(searchInput).toHaveValue("");
    await expect.element(screen.getByText("Day 2: 朝のランニング記録")).toBeVisible();
  });

  it("検索結果が 0 件のとき空状態が表示され、空状態のクリアボタンで検索を解除できること", async () => {
    const screen = await render(
      <PostListStep
        posts={samplePosts}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    await screen.getByLabelText("キャプション内キーワード検索").fill("一致しないキーワード");
    await expect.element(screen.getByText("該当する投稿がありません")).toBeVisible();

    const clearButtons = screen.getByRole("button", { name: "検索キーワードをクリア" });
    await clearButtons.last().click();
    await expect.element(screen.getByText("Day 1: 京都カフェめぐり")).toBeVisible();
  });

  it("一括選択・選択解除・並び順切替の操作でハンドラが呼ばれ、主要ボタンが 44px 以上であること", async () => {
    const onSelectAll = vi.fn();
    const onDeselectAll = vi.fn();
    const onSortOrderChange = vi.fn();

    const screen = await render(
      <PostListStep
        posts={samplePosts}
        sortOrder="asc"
        onSortOrderChange={onSortOrderChange}
        onToggleSelect={vi.fn()}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />,
    );

    const selectAllButton = screen.getByRole("button", { name: "すべて選択" });
    const deselectAllButton = screen.getByRole("button", { name: "選択解除" });
    const sortAscButton = screen.getByRole("button", { name: "古い順（おすすめ）" });
    const sortDescButton = screen.getByRole("button", { name: "新しい順" });

    expect(selectAllButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(deselectAllButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(sortAscButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(sortDescButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await selectAllButton.click();
    await deselectAllButton.click();
    await sortDescButton.click();

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
    expect(onSortOrderChange).toHaveBeenCalledWith("desc");
  });
});
