/**
 * @file EPUB 生成向け型定義
 */
import type { InstagramMedia } from "@/lib/instagram/types";
import type { CoverThemeId } from "@/types/ui";

/**
 * ユーザーが指定する EPUB メタデータ。
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
 * 生成前に整形した EPUB 章データ。
 */
export type EpubChapter = {
  title: string;
  data: string;
  filename: string;
};

/**
 * EPUB 生成処理への入力。
 */
export type EpubInput = {
  metadata: EpubMetadata;
  items: InstagramMedia[];
};
