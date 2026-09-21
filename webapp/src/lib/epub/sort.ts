/**
 * @file Shared EPUB sort helpers.
 */
import type { EpubSortOrder } from "@/types/ui";

/**
 * Sorts timestamped items into the requested EPUB reading order.
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
