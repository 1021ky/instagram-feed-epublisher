/**
 * @file Filter utilities for Instagram media.
 */
import type { FeedFilter, InstagramMedia } from "@/lib/instagram/types";

/**
 * Applies filter rules to Instagram media items.
 */
export function applyFeedFilter(items: InstagramMedia[], filter: FeedFilter): InstagramMedia[] {
  let filtered = items.filter((item) => {
    if (filter.hashtag) {
      const caption = item.caption ?? "";
      // Match #hashtag precisely, not matching #hashtagABC
      const regex = new RegExp("#" + filter.hashtag + "(?![a-zA-Z0-9_])", "i");
      if (!regex.test(caption)) {
        return false;
      }
    }
    if (filter.startDate) {
      const ts = new Date(item.timestamp).getTime();
      const start = new Date(`${filter.startDate}T00:00:00Z`).getTime();
      if (ts < start) return false;
    }
    if (filter.endDate) {
      const ts = new Date(item.timestamp).getTime();
      const end = new Date(`${filter.endDate}T23:59:59Z`).getTime();
      if (ts > end) return false;
    }
    return true;
  });

  // Sort: asc (oldest first) or desc (newest first). default is desc (Instagram's default order)
  const sortOrder = filter.sortOrder ?? "desc";
  filtered.sort((a, b) => {
    const tA = new Date(a.timestamp).getTime();
    const tB = new Date(b.timestamp).getTime();
    return sortOrder === "asc" ? tA - tB : tB - tA;
  });

  return filtered.slice(0, filter.maxCount);
}
