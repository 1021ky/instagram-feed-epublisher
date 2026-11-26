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

  it.each([
    {
      label: "sortOrder='asc'（古い順）",
      sortOrder: "asc" as const,
      expectedIds: ["1", "2"],
    },
    {
      label: "sortOrder='desc'（新しい順）",
      sortOrder: "desc" as const,
      expectedIds: ["2", "1"],
    },
  ])("$label 指定時に期待した順序で返却する", ({ sortOrder, expectedIds }) => {
    const reversed = [items[1], items[0]];
    const result = applyFeedFilter(reversed, {
      maxCount: 10,
      sortOrder,
    });
    expect(result.map((i) => i.id)).toEqual(expectedIds);
  });

  it("maxCount で件数制限したあとに sortOrder を適用すること", () => {
    const threeItems = [
      {
        id: "newest",
        caption: "3",
        media_url: "z",
        permalink: "p3",
        timestamp: "2025-03-01T00:00:00Z",
      },
      {
        id: "middle",
        caption: "2",
        media_url: "y",
        permalink: "p2",
        timestamp: "2025-02-01T00:00:00Z",
      },
      {
        id: "oldest",
        caption: "1",
        media_url: "x",
        permalink: "p1",
        timestamp: "2025-01-01T00:00:00Z",
      },
    ];
    const result = applyFeedFilter(threeItems, {
      maxCount: 2,
      sortOrder: "asc",
    });
    expect(result.map((i) => i.id)).toEqual(["middle", "newest"]);
  });
});
