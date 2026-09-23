/**
 * @file EPUB 並び順ユーティリティの単体テスト
 */
import { describe, expect, it } from "vitest";
import { sortItemsByTimestamp } from "./sort";
import type { EpubSortOrder } from "@/types/ui";

describe("sortItemsByTimestamp", () => {
  const items = [
    { id: "2", timestamp: "2026-02-01T00:00:00Z" },
    { id: "1", timestamp: "2026-01-01T00:00:00Z" },
    { id: "3", timestamp: "2026-03-01T00:00:00Z" },
  ];

  it("sortOrder 未指定時にデフォルトで昇順（古い順）に並び替えること", () => {
    const result = sortItemsByTimestamp(items);
    expect(result.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("sortOrder が 'asc' の場合に昇順（古い順）に並び替えること", () => {
    const result = sortItemsByTimestamp(items, "asc");
    expect(result.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("sortOrder が 'desc' の場合に降順（新しい順）に並び替えること", () => {
    const result = sortItemsByTimestamp(items, "desc");
    expect(result.map((i) => i.id)).toEqual(["3", "2", "1"]);
  });

  it("sortOrder に不正な値が渡された場合にデフォルトの昇順にフォールバックすること", () => {
    const result = sortItemsByTimestamp(items, "invalid" as unknown as EpubSortOrder);
    expect(result.map((i) => i.id)).toEqual(["1", "2", "3"]);
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
