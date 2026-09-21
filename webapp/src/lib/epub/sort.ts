/**
 * @file 共有 EPUB 並び順ユーティリティ
 */
import type { EpubSortOrder } from "@/types/ui";

/**
 * タイムスタンプを持つ項目を、指定された EPUB の読書順に並び替える。
 */
export function sortItemsByTimestamp<T extends { timestamp: string }>(
  items: T[],
  sortOrder: EpubSortOrder = "asc",
) {
  return [...items].sort((left, right) => {
    const leftTs = new Date(left.timestamp).getTime();
    const rightTs = new Date(right.timestamp).getTime();
    return sortOrder === "asc" ? leftTs - rightTs : rightTs - leftTs;
  });
}
