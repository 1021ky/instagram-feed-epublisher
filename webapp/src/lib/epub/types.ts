/**
 * @file Types for EPUB generation.
 */
import type { InstagramMedia } from "@/lib/instagram/types";

/**
 * EPUB metadata provided by the user.
 */
export type EpubMetadata = {
  title: string;
  author: string;
  contact: string;
  instagramUrl: string;
  language?: string;
};

/**
 * Supported cover theme identifiers.
 */
export type CoverThemeId = "navy" | "slate" | "ivory" | "white" | "purple";

/**
 * Supported chapter sort order for EPUB output.
 */
export type EpubSortOrder = "asc" | "desc";

/**
 * Prepared EPUB chapter data.
 */
export type EpubChapter = {
  title: string;
  data: string;
  filename: string;
};

/**
 * Input for EPUB generation.
 */
export type EpubInput = {
  metadata: EpubMetadata;
  items: InstagramMedia[];
  coverTheme?: CoverThemeId;
  sortOrder?: EpubSortOrder;
  selectedMediaIds?: string[];
};
