/**
 * @file 投稿カードコンポーネント (PostCard) の単体テスト
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PostCardViewModel } from "@/features/feed/model/post-presenter";
import { PostCard } from "./PostCard";

describe("投稿カード (PostCard)", () => {
  const sampleViewModel: PostCardViewModel = {
    id: "post-1",
    selected: true,
    thumbnailUrl: "https://example.com/photo.jpg",
    formattedDate: "2026/09/20 19:30",
    isoTimestamp: "2026-09-20T10:30:00Z",
    caption: "Day 99: 今日も1日やりきりました！ #100日チャレンジ",
    permalink: "https://instagram.com/p/sample123",
    likeCount: 125,
    carouselPhotos: [],
  };

  it.each([
    {
      label: "収録対象（selected: true）",
      selected: true,
      index: 1,
      expectedChecked: 'aria-checked="true"',
      expectedStatus: "収録対象",
      expectedClass: "bg-white",
    },
    {
      label: "除外対象（selected: false）",
      selected: false,
      index: 2,
      expectedChecked: 'aria-checked="false"',
      expectedStatus: "除外",
      expectedClass: "opacity-60",
    },
  ])(
    "$label のときに適切なチェック状態・ステータス・スタイルを描画すること",
    ({ selected, index, expectedChecked, expectedStatus, expectedClass }) => {
      const html = renderToStaticMarkup(
        <PostCard post={{ ...sampleViewModel, selected }} onToggleSelect={vi.fn()} index={index} />,
      );

      expect(html).toContain(expectedChecked);
      expect(html).toContain(expectedStatus);
      expect(html).toContain(expectedClass);
      expect(html).toContain(`#${index}`);
      expect(html).toContain("Day 99: 今日も1日やりきりました！");
      expect(html).toContain("125");
      expect(html).toContain("https://instagram.com/p/sample123");
      expect(html).toContain("w-11 h-11");
    },
  );

  it("カルーセル写真を持つ ViewModel のときに枚数バッジと横スクロール選択を描画すること", () => {
    const html = renderToStaticMarkup(
      <PostCard
        post={{
          ...sampleViewModel,
          carouselPhotos: [
            { id: "c1", url: "https://example.com/c1.jpg", selected: true },
            { id: "c2", url: "https://example.com/c2.jpg", selected: false },
            { id: "c3", url: "https://example.com/c3.jpg", selected: true },
          ],
        }}
        onToggleSelect={vi.fn()}
        onToggleChildSelect={vi.fn()}
      />,
    );

    expect(html).toContain("2/3枚");
    expect(html).toContain("収録する写真を選択（2/3枚）");
    expect(html).toContain("overflow-x-auto");
  });
});
