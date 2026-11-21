/**
 * @file Filter utilities for Instagram media.
 */
import type { FeedFilter, InstagramMedia } from "@/lib/instagram/types";

/**
 * Applies filter rules to Instagram media items.
 */
export function applyFeedFilter(items: InstagramMedia[], filter: FeedFilter): InstagramMedia[] {
  return items
    .filter((item) => {
      if (filter.hashtag) {
        const caption = item.caption ?? "";
        if (!caption.toLowerCase().includes(filter.hashtag.toLowerCase())) {
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
    })
    .slice(0, filter.maxCount);
}
