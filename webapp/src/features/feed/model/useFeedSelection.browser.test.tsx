import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { EpubSortOrder, FeedPostItem } from "@/types/ui";
import { useFeedSelection } from "./useFeedSelection";

/** 並び順切替とカルーセル子画像トグルを検証するための基準投稿データ（古い単一画像1件＋新しい2枚カルーセル1件） */
const initialPosts: FeedPostItem[] = [
  {
    id: "p-older",
    media_type: "IMAGE",
    media_url: "https://example.com/1.jpg",
    permalink: "https://instagram.com/p/p-older",
    timestamp: "2026-09-10T10:00:00Z",
    caption: "古い投稿",
    selected: true,
  },
  {
    id: "p-carousel",
    media_type: "CAROUSEL_ALBUM",
    media_url: "https://example.com/c1.jpg",
    permalink: "https://instagram.com/p/p-carousel",
    timestamp: "2026-09-20T10:00:00Z",
    caption: "新しいカルーセル投稿",
    selected: true,
    children: {
      data: [
        { id: "c1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
        { id: "c2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
      ],
    },
  },
];

/**
 * useFeedSelection の状態遷移をブラウザ上で検証するためのテスト用ハーネス。
 */
function FeedSelectionHarness() {
  const [sortOrder, setSortOrder] = useState<EpubSortOrder>("asc");
  const {
    sortedFeed,
    selectedPosts,
    setFeed,
    clearFeed,
    toggleSelect,
    toggleChildSelect,
    selectAll,
    deselectAll,
  } = useFeedSelection({ sortOrder });

  const carouselPost = sortedFeed.find((post) => post.id === "p-carousel");

  return (
    <div>
      <output data-testid="sorted-ids">{sortedFeed.map((post) => post.id).join(",")}</output>
      <output data-testid="selected-ids">{selectedPosts.map((post) => post.id).join(",")}</output>
      <output data-testid="carousel-children">
        {carouselPost?.selectedChildIds === undefined
          ? "ALL"
          : carouselPost.selectedChildIds.join(",")}
      </output>

      <button type="button" onClick={() => setFeed(initialPosts)}>
        投稿をセット
      </button>
      <button type="button" onClick={() => setSortOrder("desc")}>
        新しい順にする
      </button>
      <button type="button" onClick={() => toggleSelect("p-older")}>
        古い投稿をトグル
      </button>
      <button type="button" onClick={() => toggleChildSelect("p-carousel", "c1")}>
        子画像1をトグル
      </button>
      <button type="button" onClick={() => toggleChildSelect("p-carousel", "c2")}>
        子画像2をトグル
      </button>
      <button type="button" onClick={() => toggleSelect("p-carousel")}>
        カルーセル親をトグル
      </button>
      <button type="button" onClick={deselectAll}>
        全解除
      </button>
      <button type="button" onClick={selectAll}>
        全選択
      </button>
      <button type="button" onClick={clearFeed}>
        クリア
      </button>
    </div>
  );
}

describe("投稿選択状態フックの振る舞い (useFeedSelection)", () => {
  it("sortOrder に応じて sortedFeed と selectedPosts の順序が同期すること", async () => {
    const screen = await render(<FeedSelectionHarness />);

    await screen.getByRole("button", { name: "投稿をセット" }).click();
    await expect.element(screen.getByTestId("sorted-ids")).toHaveTextContent("p-older,p-carousel");
    await expect
      .element(screen.getByTestId("selected-ids"))
      .toHaveTextContent("p-older,p-carousel");

    await screen.getByRole("button", { name: "新しい順にする" }).click();
    await expect.element(screen.getByTestId("sorted-ids")).toHaveTextContent("p-carousel,p-older");
    await expect
      .element(screen.getByTestId("selected-ids"))
      .toHaveTextContent("p-carousel,p-older");
  });

  it("カルーセル子画像をすべて解除すると親が除外され、親再選択で全画像選択へ復帰すること", async () => {
    const screen = await render(<FeedSelectionHarness />);

    await screen.getByRole("button", { name: "投稿をセット" }).click();
    await screen.getByRole("button", { name: "子画像1をトグル" }).click();
    await expect.element(screen.getByTestId("carousel-children")).toHaveTextContent("c2");

    await screen.getByRole("button", { name: "子画像2をトグル" }).click();
    await expect.element(screen.getByTestId("selected-ids")).toHaveTextContent("p-older");
    await expect.element(screen.getByTestId("carousel-children")).toHaveTextContent("");

    await screen.getByRole("button", { name: "カルーセル親をトグル" }).click();
    await expect
      .element(screen.getByTestId("selected-ids"))
      .toHaveTextContent("p-older,p-carousel");
    await expect.element(screen.getByTestId("carousel-children")).toHaveTextContent("ALL");
  });

  it("単体トグル・全解除・全選択・clearFeed で投稿一覧と選択状態が正しく更新されること", async () => {
    const screen = await render(<FeedSelectionHarness />);

    await screen.getByRole("button", { name: "投稿をセット" }).click();
    await screen.getByRole("button", { name: "古い投稿をトグル" }).click();
    await expect.element(screen.getByTestId("selected-ids")).toHaveTextContent("p-carousel");

    await screen.getByRole("button", { name: "全解除" }).click();
    await expect.element(screen.getByTestId("selected-ids")).toHaveTextContent("");

    await screen.getByRole("button", { name: "全選択" }).click();
    await expect
      .element(screen.getByTestId("selected-ids"))
      .toHaveTextContent("p-older,p-carousel");

    await screen.getByRole("button", { name: "クリア" }).click();
    await expect.element(screen.getByTestId("sorted-ids")).toHaveTextContent("");
    await expect.element(screen.getByTestId("selected-ids")).toHaveTextContent("");
  });
});
