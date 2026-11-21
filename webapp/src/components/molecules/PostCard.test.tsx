import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FeedPostItem } from "@/types/ui";
import { formatPostDate, PostCard } from "./PostCard";

describe("投稿カード (PostCard)", () => {
  const samplePost: FeedPostItem = {
    id: "post-1",
    media_url: "https://example.com/photo.jpg",
    permalink: "https://instagram.com/p/sample123",
    timestamp: "2026-09-20T10:30:00Z",
    caption: "Day 99: 今日も1日やりきりました！ #100日チャレンジ",
    like_count: 125,
    selected: true,
  };

  it("formatPostDate が正しくフォーマットすること", () => {
    const formatted = formatPostDate("2026-09-20T10:30:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });

  it("収録対象（selected: true）のときチェックボックスがアクティブでいいね数が表示されること", () => {
    const html = renderToStaticMarkup(
      <PostCard post={samplePost} onToggleSelect={vi.fn()} index={1} />,
    );

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Day 99: 今日も1日やりきりました！");
    expect(html).toContain("125"); // いいね数
    expect(html).toContain("収録対象");
    expect(html).toContain("#1");
    expect(html).toContain("https://instagram.com/p/sample123");

    // タップ領域 44x44px (w-11 h-11) をチェックボックスに確保
    expect(html).toContain("w-11 h-11");
  });

  it("除外対象（selected: false）のとき非選択スタイルが適用されること", () => {
    const excludedPost: FeedPostItem = {
      ...samplePost,
      selected: false,
    };

    const html = renderToStaticMarkup(
      <PostCard post={excludedPost} onToggleSelect={vi.fn()} index={2} />,
    );

    expect(html).toContain('aria-checked="false"');
    expect(html).toContain("除外");
    expect(html).toContain("opacity-60");
  });

  it("キャプションが存在しない場合にフォールバック文言が表示されること", () => {
    const noCaptionPost: FeedPostItem = {
      ...samplePost,
      caption: undefined,
    };

    const html = renderToStaticMarkup(<PostCard post={noCaptionPost} onToggleSelect={vi.fn()} />);

    expect(html).toContain("(キャプションなし)");
  });

  it("カルーセル投稿（複数枚画像）のとき枚数バッジと子画像選択UIが表示されること", () => {
    const carouselPost: FeedPostItem = {
      ...samplePost,
      id: "carousel-1",
      media_type: "CAROUSEL_ALBUM",
      children: {
        data: [
          { id: "child-1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
          { id: "child-2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
          { id: "child-3", media_type: "IMAGE", media_url: "https://example.com/c3.jpg" },
        ],
      },
      selectedChildIds: ["child-1", "child-3"],
    };

    const html = renderToStaticMarkup(
      <PostCard post={carouselPost} onToggleSelect={vi.fn()} onToggleChildSelect={vi.fn()} />,
    );

    expect(html).toContain("収録する写真を選択（2/3枚）");
    expect(html).not.toContain("1枚1ページで収録");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("shrink-0");
    expect(html).toContain("カルーセル画像の収録選択");
    expect(html).toContain('aria-label="画像 1 をEPUBから除外"');
    expect(html).toContain('aria-label="画像 2 をEPUBに収録"');
    expect(html).toContain('aria-label="画像 3 をEPUBから除外"');
  });

  it("動画投稿（VIDEO）のとき thumbnail_url をサムネイルとして描画すること", () => {
    const videoPost: FeedPostItem = {
      ...samplePost,
      id: "video-1",
      media_type: "VIDEO",
      media_url: "https://example.com/video.mp4",
      thumbnail_url: "https://example.com/video-thumb.jpg",
    };

    const html = renderToStaticMarkup(<PostCard post={videoPost} onToggleSelect={vi.fn()} />);

    expect(html).toContain("https://example.com/video-thumb.jpg");
    expect(html).not.toContain("https://example.com/video.mp4");
  });
});
