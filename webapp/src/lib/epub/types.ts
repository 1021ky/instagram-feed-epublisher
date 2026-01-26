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
};
