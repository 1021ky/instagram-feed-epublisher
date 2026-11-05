import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FeedPostItem } from "@/types/ui";
import { PostListStep } from "./PostListStep";

describe("投稿リストステップ (PostListStep)", () => {
  const samplePosts: FeedPostItem[] = [
    {
      id: "p1",
      media_url: "https://example.com/1.jpg",
      permalink: "https://instagram.com/p/1",
      timestamp: "2026-09-18T10:00:00Z",
      caption: "Day 98: 朝のランニング記録",
      like_count: 50,
      selected: true,
    },
    {
      id: "p2",
      media_url: "https://example.com/2.jpg",
      permalink: "https://instagram.com/p/2",
      timestamp: "2026-09-19T10:00:00Z",
      caption: "Day 99: カフェで読書",
      like_count: 75,
      selected: true,
    },
    {
      id: "p3",
      media_url: "https://example.com/3.jpg",
      permalink: "https://instagram.com/p/3",
      timestamp: "2026-09-20T10:00:00Z",
      caption: "Day 100: 祝・完走！",
      like_count: 200,
      selected: false,
    },
  ];

  it("選択件数が正確に集計・バッジ表示されること", () => {
    const html = renderToStaticMarkup(
      <PostListStep
        posts={samplePosts}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    // 3件中2件選択中
    expect(html).toContain("選択中: 2 / 3 件");
    expect(html).toContain("すべて選択");
    expect(html).toContain("選択解除");
    expect(html).toContain("Day 98: 朝のランニング記録");
    expect(html).toContain("Day 99: カフェで読書");
    expect(html).toContain("Day 100: 祝・完走！");

    // 固定バーと被らない余白が設定されていること
    expect(html).toContain("pb-28");
  });

  it("投稿が0件のときに親切な空状態（Empty State）が表示されること", () => {
    const html = renderToStaticMarkup(
      <PostListStep
        posts={[]}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    expect(html).toContain("投稿が見つかりませんでした");
    expect(html).toContain("選択中: 0 / 0 件");
  });

  it("フィード未取得（isFetched=false）のときに未取得案内が表示されること", () => {
    const html = renderToStaticMarkup(
      <PostListStep
        posts={[]}
        isFetched={false}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    expect(html).toContain("Step 2: 投稿の確認・選択");
    expect(html).toContain("未取得");
    expect(html).toContain("投稿はまだ取得されていません");
    expect(html).toContain("この条件で投稿を取得");
  });
});
