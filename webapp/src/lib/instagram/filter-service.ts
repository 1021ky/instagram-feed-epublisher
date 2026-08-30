/**
 * @file Filter utilities for Instagram media.
 */
import type { FeedFilter, InstagramMedia } from "@/lib/instagram/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("instagram.filter-service");

/**
 * Applies filter rules to Instagram media items.
 */
export function applyFeedFilter(items: InstagramMedia[], filter: FeedFilter): InstagramMedia[] {
  let excludedByHashtag = 0;
  let excludedByStartDate = 0;
  let excludedByEndDate = 0;

  const filtered = items.filter((item) => {
    if (filter.hashtag) {
      const caption = item.caption ?? "";
      if (!caption.toLowerCase().includes(filter.hashtag.toLowerCase())) {
        excludedByHashtag++;
        return false;
      }
    }
    if (filter.startDate) {
      const ts = new Date(item.timestamp).getTime();
      const start = new Date(`${filter.startDate}T00:00:00Z`).getTime();
      if (ts < start) {
        excludedByStartDate++;
        return false;
      }
    }
    if (filter.endDate) {
      const ts = new Date(item.timestamp).getTime();
      const end = new Date(`${filter.endDate}T23:59:59Z`).getTime();
      if (ts > end) {
        excludedByEndDate++;
        return false;
      }
    }
    return true;
  });

  const result = filtered.slice(0, filter.maxCount);

  logger.info("Feed filter applied", {
    inputCount: items.length,
    matchedCount: filtered.length,
    resultCount: result.length,
    filter,
    exclusionStats: {
      excludedByHashtag,
      excludedByStartDate,
      excludedByEndDate,
    },
  });

  return result;
}
