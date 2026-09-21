/**
 * @file Types for Instagram Graph API and filters.
 */
import type { EpubSortOrder } from "@/types/ui";

/**
 * Feed filter options.
 */
export type FeedFilter = {
  hashtag?: string;
  startDate?: string;
  endDate?: string;
  maxCount: number;
  sortOrder?: EpubSortOrder;
};

/**
 * Normalized Instagram media item.
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
};
