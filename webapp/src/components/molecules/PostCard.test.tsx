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
});
