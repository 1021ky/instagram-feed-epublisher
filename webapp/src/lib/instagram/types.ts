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
  sortOrder?: "asc" | "desc"; // asc: oldest first, desc: newest first
};

/**
 * Normalized Instagram media item.
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: {
    data: {
      id: string;
      media_type: "IMAGE" | "VIDEO";
      media_url?: string;
      thumbnail_url?: string;
    }[];
  };
};
