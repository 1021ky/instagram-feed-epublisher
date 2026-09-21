/**
 * @file Instagram Graph API と絞り込み条件の型定義
 */
import type { EpubSortOrder } from "@/types/ui";

/**
 * フィードの絞り込み条件。
 */
export type FeedFilter = {
  hashtag?: string;
  startDate?: string;
  endDate?: string;
  maxCount: number;
  sortOrder?: EpubSortOrder;
};

/**
 * 正規化済みの Instagram メディア項目。
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
};
