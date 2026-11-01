/**
 * @file EPUB 並び順ユーティリティの単体テスト
 */
import { describe, expect, it } from "vitest";
import { sortItemsByTimestamp } from "./sort";
import type { EpubSortOrder } from "@/types/ui";

describe("投稿アイテムの日時ソート (sortItemsByTimestamp)", () => {
  const items = [
    { id: "2", timestamp: "2026-02-01T00:00:00Z" },
    { id: "1", timestamp: "2026-01-01T00:00:00Z" },
    { id: "3", timestamp: "2026-03-01T00:00:00Z" },
  ];

  it.each([
    {
      label: "未指定時（デフォルトで昇順）",
      sortOrder: undefined,
      expectedIds: ["1", "2", "3"],
    },
    {
      label: "明示的な昇順 ('asc')",
      sortOrder: "asc" as const,
      expectedIds: ["1", "2", "3"],
    },
    {
      label: "降順 ('desc')",
      sortOrder: "desc" as const,
      expectedIds: ["3", "2", "1"],
    },
    {
      label: "不正値フォールバック",
      sortOrder: "invalid" as unknown as EpubSortOrder,
      expectedIds: ["1", "2", "3"],
    },
  ])("sortOrder が $label の場合に適切な順序へ並び替えること", ({ sortOrder, expectedIds }) => {
    const result = sortItemsByTimestamp(items, sortOrder);
    expect(result.map((i) => i.id)).toEqual(expectedIds);
  });

  it("元の配列を変更しないこと（イミュータブル性）", () => {
    const originalOrder = items.map((i) => i.id);
    sortItemsByTimestamp(items, "desc");
    expect(items.map((i) => i.id)).toEqual(originalOrder);
  });

  it("空配列を渡しても正常に空配列を返すこと", () => {
    const result = sortItemsByTimestamp([]);
    expect(result).toEqual([]);
  });
});
