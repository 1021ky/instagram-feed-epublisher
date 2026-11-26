/**
 * @file 共有 EPUB 並び順ユーティリティ
 */
import type { EpubSortOrder } from "@/types/ui";

/**
 * タイムスタンプを持つ項目を、指定された EPUB の読書順に並び替える。
 * 不正な timestamp（NaN）を持つ項目は末尾に元の順序のまま配置する。
 */
export function sortItemsByTimestamp<T extends { timestamp: string }>(
  items: T[],
  sortOrder: EpubSortOrder = "asc",
): T[] {
  const normalizedOrder = sortOrder === "desc" ? "desc" : "asc";
  return items
    .map((item, index) => ({
      item,
      index,
      timestamp: Date.parse(item.timestamp),
    }))
    .sort((left, right) => {
      const leftValid = !Number.isNaN(left.timestamp);
      const rightValid = !Number.isNaN(right.timestamp);

      if (!leftValid && !rightValid) {
        return left.index - right.index;
      }
      if (!leftValid) {
        return 1;
      }
      if (!rightValid) {
        return -1;
      }

      const delta = left.timestamp - right.timestamp;
      return normalizedOrder === "asc" ? delta : -delta;
    })
    .map(({ item }) => item);
}
