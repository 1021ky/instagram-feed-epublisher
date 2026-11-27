import { describe, expect, it } from "vitest";
import type { FeedPostItem } from "@/types/ui";
import { toPostCardViewModel } from "./post-presenter";

describe("投稿カード ViewModel 変換 (toPostCardViewModel)", () => {
  /** 通常画像投稿の変換テストで基準となるサンプル投稿データ（前後空白キャプション・いいね数付き） */
  const basePost: FeedPostItem = {
    id: "post-1",
    media_type: "IMAGE",
    media_url: "https://example.com/photo.jpg",
    permalink: "https://instagram.com/p/1",
    timestamp: "2026-09-20T10:30:00Z",
    caption: "  今日の記録 #100日チャレンジ  ",
    like_count: 42,
    selected: true,
  };

  it("通常画像投稿を整形済み ViewModel に変換すること", () => {
    const vm = toPostCardViewModel(basePost);

    expect(vm.id).toBe("post-1");
    expect(vm.selected).toBe(true);
    expect(vm.thumbnailUrl).toBe("https://example.com/photo.jpg");
    expect(vm.formattedDate).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    expect(vm.caption).toBe("今日の記録 #100日チャレンジ");
    expect(vm.likeCount).toBe(42);
    expect(vm.carouselPhotos).toEqual([]);
  });

  it("キャプション欠落時にデフォルト文言へフォールバックすること", () => {
    const vm = toPostCardViewModel({ ...basePost, caption: "   " });
    expect(vm.caption).toBe("(キャプションなし)");
  });

  it("動画投稿では thumbnail_url を代表画像として採用すること", () => {
    const vm = toPostCardViewModel({
      ...basePost,
      media_type: "VIDEO",
      media_url: "https://example.com/video.mp4",
      thumbnail_url: "https://example.com/video-thumb.jpg",
    });
    expect(vm.thumbnailUrl).toBe("https://example.com/video-thumb.jpg");
  });

  it.each([
    {
      label: "子画像未指定時（全枚数選択 + 1枚目サムネ）",
      selected: true,
      selectedChildIds: undefined,
      expectedSelectedFlags: [true, true, true],
      expectedThumbnail: "https://example.com/c1.jpg",
    },
    {
      label: "2枚目と3枚目のみ選択時（代表サムネが2枚目に切り替わる）",
      selected: true,
      selectedChildIds: ["child-2", "child-3"],
      expectedSelectedFlags: [false, true, true],
      expectedThumbnail: "https://example.com/c2.jpg",
    },
    {
      label: "投稿自体が除外時（全子画像も未選択扱い）",
      selected: false,
      selectedChildIds: undefined,
      expectedSelectedFlags: [false, false, false],
      expectedThumbnail: "https://example.com/c1.jpg",
    },
  ])(
    "カルーセル投稿で $label の場合に正しい選択状態とサムネイルを返すこと",
    ({ selected, selectedChildIds, expectedSelectedFlags, expectedThumbnail }) => {
      const vm = toPostCardViewModel({
        ...basePost,
        media_type: "CAROUSEL_ALBUM",
        selected,
        selectedChildIds,
        children: {
          data: [
            { id: "child-1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
            { id: "child-2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
            { id: "child-3", media_type: "IMAGE", media_url: "https://example.com/c3.jpg" },
          ],
        },
      });

      expect(vm.carouselPhotos.map((p) => p.selected)).toEqual(expectedSelectedFlags);
      expect(vm.thumbnailUrl).toBe(expectedThumbnail);
    },
  );
});
