/**
 * @file EPUB生成向けの型定義。
 */
import type { InstagramMedia } from "@/lib/instagram/types";
import type { CoverThemeId, EpubSortOrder } from "@/types/ui";

export type { CoverThemeId, EpubSortOrder };

/**
 * ユーザーが指定するEPUBメタデータ。
 */
export type EpubMetadata = {
  title: string;
  author: string;
  contact: string;
  instagramUrl: string;
  language?: string;
  subtitle?: string;
  coverTheme?: CoverThemeId;
};

/**
 * 生成用に整形したEPUB章データ。
 */
export type EpubChapter = {
  title: string;
  data: string;
  filename: string;
};

/**
 * EPUB生成時の入力データ。
 */
export type EpubInput = {
  metadata: EpubMetadata;
  items: InstagramMedia[];
  coverTheme?: CoverThemeId;
  sortOrder?: EpubSortOrder;
  selectedMediaIds?: string[];
};
