import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { PostCardViewModel } from "../model/post-presenter";
import { PostCard } from "./PostCard";

const mockImageUrl =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";

const baseViewModel: PostCardViewModel = {
  id: "post-1",
  selected: true,
  thumbnailUrl: mockImageUrl,
  formattedDate: "2026/09/20 19:30",
  isoTimestamp: "2026-09-20T10:30:00Z",
  caption: "カルーセル付き投稿のテスト",
  permalink: "https://instagram.com/p/sample123",
  likeCount: 125,
  carouselPhotos: [
    { id: "c1", url: mockImageUrl, selected: true },
    { id: "c2", url: mockImageUrl, selected: false },
    { id: "c3", url: mockImageUrl, selected: true },
  ],
};

describe("投稿カードのクリック・イベント伝播制御 (PostCard)", () => {
  it("カード本体をクリックすると onToggleSelect が 1 回呼ばれること", async () => {
    const onToggleSelect = vi.fn();
    const screen = await render(
      <PostCard post={baseViewModel} onToggleSelect={onToggleSelect} index={1} />,
    );

    await screen.getByText("カルーセル付き投稿のテスト").click();
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onToggleSelect).toHaveBeenCalledWith("post-1");
  });

  it("チェックボックスをクリックしても親カードへ二重伝播せず、44px 以上のタップ領域を持つこと", async () => {
    const onToggleSelect = vi.fn();
    const screen = await render(
      <PostCard post={baseViewModel} onToggleSelect={onToggleSelect} index={1} />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "この投稿をEPUBから除外" });
    const rect = checkbox.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await checkbox.click();
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onToggleSelect).toHaveBeenCalledWith("post-1");
  });

  it("元投稿への外部リンクをクリックしても親カードの選択状態が切り替わらないこと", async () => {
    const onToggleSelect = vi.fn();
    const screen = await render(
      <PostCard post={baseViewModel} onToggleSelect={onToggleSelect} index={1} />,
    );

    const externalLink = screen.getByRole("link", { name: "Instagramで元の投稿を開く" });
    externalLink.element().addEventListener("click", (event) => event.preventDefault());

    await externalLink.click();
    expect(onToggleSelect).not.toHaveBeenCalled();
  });

  it("カルーセル子画像をクリックしても親カードへ伝播せず onToggleChildSelect のみ呼ばれること", async () => {
    const onToggleSelect = vi.fn();
    const onToggleChildSelect = vi.fn();
    const screen = await render(
      <PostCard
        post={baseViewModel}
        onToggleSelect={onToggleSelect}
        onToggleChildSelect={onToggleChildSelect}
        index={1}
      />,
    );

    const secondPhotoCheckbox = screen.getByRole("checkbox", { name: "画像 2 をEPUBに収録" });
    const rect = secondPhotoCheckbox.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await secondPhotoCheckbox.click();
    expect(onToggleChildSelect).toHaveBeenCalledTimes(1);
    expect(onToggleChildSelect).toHaveBeenCalledWith("post-1", "c2");
    expect(onToggleSelect).not.toHaveBeenCalled();
  });

  it("カルーセル領域のラベル部分をクリックしても親カードの選択状態が切り替わらないこと", async () => {
    const onToggleSelect = vi.fn();
    const screen = await render(
      <PostCard post={baseViewModel} onToggleSelect={onToggleSelect} index={1} />,
    );

    await screen.getByText("収録する写真を選択（2/3枚）").click();
    expect(onToggleSelect).not.toHaveBeenCalled();
  });
});
