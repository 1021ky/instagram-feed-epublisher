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
 * Instagram メディア種別。
 */
export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

/**
 * カルーセル投稿内の子メディア項目。
 */
export type InstagramMediaChild = {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url?: string;
  thumbnail_url?: string;
};

/**
 * 正規化済みの Instagram メディア項目。
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type?: InstagramMediaType;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: {
    data: InstagramMediaChild[];
  };
};

/**
 * 投稿キャプションから集計されたハッシュタグ候補。
 */
export type HashtagSuggestion = {
  /** 先頭の `#` を除いた正規化済みタグ文字列 */
  tag: string;
  /** 対象期間・スキャン範囲内でこのタグが出現した投稿数 */
  count: number;
  /** このタグが最後に使用された投稿のタイムスタンプ（ISO 8601） */
  lastUsedAt: string;
};
