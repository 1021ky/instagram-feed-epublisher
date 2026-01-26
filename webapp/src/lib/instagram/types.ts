/**
 * @file Types for Instagram Graph API and filters.
 */

/**
 * Feed filter options.
 */
export type FeedFilter = {
  hashtag?: string;
  startDate?: string;
  endDate?: string;
  maxCount: number;
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
