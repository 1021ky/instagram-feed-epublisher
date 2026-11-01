/**
 * @file フィード絞り込みサービスの単体テスト
 */
import { describe, expect, it } from "vitest";
import { applyFeedFilter } from "./filter-service";

const items = [
  {
    id: "1",
    caption: "#travel day",
    media_url: "x",
    permalink: "p",
    timestamp: new Date("2025-01-01T00:00:00Z").toISOString(),
  },
  {
    id: "2",
    caption: "#food",
    media_url: "y",
    permalink: "q",
    timestamp: new Date("2025-02-01T00:00:00Z").toISOString(),
  },
];

describe("フィード絞り込み処理 (applyFeedFilter)", () => {
  it("指定したハッシュタグに合致する投稿のみを抽出して返す", () => {
    const result = applyFeedFilter(items, {
      hashtag: "travel",
      maxCount: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });

  it("条件に合致する投稿がない場合は空配列を返す", () => {
    const result = applyFeedFilter(items, {
      hashtag: "unknown",
      maxCount: 10,
    });
    expect(result).toHaveLength(0);
  });
});
