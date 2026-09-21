import { describe, expect, it } from "vitest";
import { sampleDemoFeedData } from "./sampleData";

describe("sampleDemoFeedData", () => {
  it("100日チャレンジ用の100件データを提供すること", () => {
    expect(sampleDemoFeedData.username).toBe("demo_100days");
    expect(sampleDemoFeedData.hashtag).toBe("#100日チャレンジ");
    expect(sampleDemoFeedData.posts).toHaveLength(100);
  });

  it("各投稿が安全な data URL 画像と Instagram パーマリンクを持つこと", () => {
    for (const item of sampleDemoFeedData.posts) {
      expect(item.media_url.startsWith("data:image/svg+xml")).toBe(true);
      expect(item.permalink.startsWith("https://www.instagram.com/p/demo")).toBe(true);
      expect(item.caption).toContain("#100日チャレンジ");
    }
  });
});
