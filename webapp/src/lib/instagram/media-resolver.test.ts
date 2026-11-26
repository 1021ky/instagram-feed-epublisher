/**
 * @file メディア画像・カルーセル解決ヘルパーの単体テスト
 */
import { describe, expect, it } from "vitest";
import type { InstagramMedia } from "@/lib/instagram/types";
import {
  listCarouselMediaEntries,
  resolveMediaDisplayUrl,
  resolveMediaImagesForEpub,
} from "./media-resolver";

describe("代表サムネイル画像 URL 解決 (resolveMediaDisplayUrl)", () => {
  it.each<{
    label: string;
    item: InstagramMedia;
    expected: string | undefined;
  }>([
    {
      label: "通常の画像投稿 (IMAGE)",
      item: {
        id: "1",
        media_type: "IMAGE",
        media_url: "https://example.com/image.jpg",
        permalink: "https://instagram.com/p/1",
        timestamp: "2026-10-01T00:00:00Z",
      },
      expected: "https://example.com/image.jpg",
    },
    {
      label: "media_type 省略時の後方互換投稿",
      item: {
        id: "2",
        media_url: "https://example.com/legacy.jpg",
        permalink: "https://instagram.com/p/2",
        timestamp: "2026-10-01T00:00:00Z",
      },
      expected: "https://example.com/legacy.jpg",
    },
    {
      label: "動画投稿 (VIDEO) のサムネイル優先",
      item: {
        id: "3",
        media_type: "VIDEO",
        media_url: "https://example.com/video.mp4",
        thumbnail_url: "https://example.com/thumb.jpg",
        permalink: "https://instagram.com/p/3",
        timestamp: "2026-10-01T00:00:00Z",
      },
      expected: "https://example.com/thumb.jpg",
    },
    {
      label: "動画投稿 (VIDEO) でサムネイル欠落時は undefined",
      item: {
        id: "4",
        media_type: "VIDEO",
        media_url: "https://example.com/video.mp4",
        permalink: "https://instagram.com/p/4",
        timestamp: "2026-10-01T00:00:00Z",
      },
      expected: undefined,
    },
    {
      label: "カルーセル投稿 (CAROUSEL_ALBUM) の先頭画像",
      item: {
        id: "5",
        media_type: "CAROUSEL_ALBUM",
        media_url: "https://example.com/parent.jpg",
        permalink: "https://instagram.com/p/5",
        timestamp: "2026-10-01T00:00:00Z",
        children: {
          data: [
            { id: "c1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
            { id: "c2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
          ],
        },
      },
      expected: "https://example.com/c1.jpg",
    },
    {
      label: "カルーセル投稿で先頭が動画(VIDEO)の場合はサムネイルを利用",
      item: {
        id: "6",
        media_type: "CAROUSEL_ALBUM",
        permalink: "https://instagram.com/p/6",
        timestamp: "2026-10-01T00:00:00Z",
        children: {
          data: [
            {
              id: "c1",
              media_type: "VIDEO",
              media_url: "https://example.com/c1.mp4",
              thumbnail_url: "https://example.com/c1-thumb.jpg",
            },
            { id: "c2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
          ],
        },
      },
      expected: "https://example.com/c1-thumb.jpg",
    },
    {
      label: "カルーセル投稿で子要素が空の場合は親 media_url へフォールバック",
      item: {
        id: "7",
        media_type: "CAROUSEL_ALBUM",
        media_url: "https://example.com/fallback.jpg",
        permalink: "https://instagram.com/p/7",
        timestamp: "2026-10-01T00:00:00Z",
        children: { data: [] },
      },
      expected: "https://example.com/fallback.jpg",
    },
  ])("$label の場合に期待する画像 URL を返すこと", ({ item, expected }) => {
    expect(resolveMediaDisplayUrl(item)).toBe(expected);
  });
});

describe("カルーセル子画像展開・選択解決 (listCarouselMediaEntries / resolveMediaImagesForEpub)", () => {
  const carouselPost: InstagramMedia = {
    id: "carousel-1",
    caption: "複数枚投稿テスト",
    media_type: "CAROUSEL_ALBUM",
    media_url: "https://example.com/c1.jpg",
    permalink: "https://instagram.com/p/carousel-1",
    timestamp: "2026-10-01T00:00:00Z",
    children: {
      data: [
        { id: "child-1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
        {
          id: "child-2",
          media_type: "VIDEO",
          media_url: "https://example.com/c2.mp4",
          thumbnail_url: "https://example.com/c2-thumb.jpg",
        },
        { id: "child-3", media_type: "IMAGE", media_url: "https://example.com/c3.jpg" },
        { id: "child-4-no-thumb", media_type: "VIDEO", media_url: "https://example.com/c4.mp4" },
      ],
    },
  };

  it("listCarouselMediaEntries が有効な画像 URL を持つ子要素のみを順番通りに返すこと", () => {
    const entries = listCarouselMediaEntries(carouselPost);
    expect(entries).toEqual([
      { id: "child-1", url: "https://example.com/c1.jpg", mediaType: "IMAGE", index: 0 },
      {
        id: "child-2",
        url: "https://example.com/c2-thumb.jpg",
        mediaType: "VIDEO",
        index: 1,
      },
      { id: "child-3", url: "https://example.com/c3.jpg", mediaType: "IMAGE", index: 2 },
    ]);
  });

  it.each([
    {
      label: "子画像未指定時（全有効画像を展開）",
      selectedChildIds: undefined,
      expectedUrls: [
        "https://example.com/c1.jpg",
        "https://example.com/c2-thumb.jpg",
        "https://example.com/c3.jpg",
      ],
    },
    {
      label: "一部の子画像のみ選択時（元の投稿内順序を保持）",
      selectedChildIds: ["child-3", "child-1"],
      expectedUrls: ["https://example.com/c1.jpg", "https://example.com/c3.jpg"],
    },
    {
      label: "明示的に空配列指定時（0件を返す）",
      selectedChildIds: [],
      expectedUrls: [],
    },
  ])(
    "resolveMediaImagesForEpub が $label に正しく画像を解決すること",
    ({ selectedChildIds, expectedUrls }) => {
      const resolved = resolveMediaImagesForEpub(carouselPost, selectedChildIds);
      expect(resolved.map((r) => r.url)).toEqual(expectedUrls);
      resolved.forEach((entry, idx) => {
        expect(entry.childIndex).toBe(idx);
        expect(entry.totalCount).toBe(expectedUrls.length);
      });
    },
  );
});
