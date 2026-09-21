/**
 * @file EPUB生成向けの型定義。
 */
import type { InstagramMedia } from "@/lib/instagram/types";

/**
 * ユーザーが指定するEPUBメタデータ。
 */
export type EpubMetadata = {
  title: string;
  author: string;
  contact: string;
  instagramUrl: string;
  language?: string;
};

/**
 * サポートしている表紙テーマの識別子。
 */
export type CoverThemeId = "navy" | "slate" | "ivory" | "white" | "purple";

/**
 * EPUB出力時に利用する章の並び順。
 */
export type EpubSortOrder = "asc" | "desc";

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
