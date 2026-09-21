/**
 * @file Common UI types for Instagram Feed Epublisher (v2 Design Renewal).
 * Provides shared types for step management, filter forms, post selection,
 * EPUB custom settings, cover themes, and demo mode.
 */

/**
 * Wizard step numbers (1: Filter, 2: Post Selection, 3: EPUB Customization).
 */
export type StepNumber = 1 | 2 | 3;

/**
 * Wizard step identifiers.
 */
export type StepId = "filter" | "select" | "customize";

/**
 * Application operating modes.
 * - `real`: Authenticated via Instagram SSO, fetching real Graph API feed.
 * - `demo`: Interactive demo mode using bundled sample challenge data without login.
 */
export type AppMode = "real" | "demo";

/**
 * Date range preset options for the feed filter.
 */
export type DatePreset = "100days" | "30days" | "all" | "custom";

/**
 * Options for filtering Instagram feed posts in Step 1.
 */
export interface FeedFilterOptions {
  /** Target hashtag (with or without '#' prefix) */
  hashtag?: string;
  /** ISO format start date (YYYY-MM-DD) */
  startDate?: string;
  /** ISO format end date (YYYY-MM-DD) */
  endDate?: string;
  /** Maximum number of posts to retrieve (1 - 500) */
  maxCount: number;
}

/**
 * UI-extended Instagram feed item representation for Step 2 selection.
 * Note: `like_count` is exclusively for in-app UI display/sorting and is
 * strictly excluded from EPUB output per product policy.
 */
export interface FeedPostItem {
  /** Unique Instagram media ID */
  id: string;
  /** Image or media display URL */
  media_url: string;
  /** Instagram web permalink */
  permalink: string;
  /** Post caption text */
  caption?: string;
  /** Publication timestamp in ISO 8601 format */
  timestamp: string;
  /** Number of likes (UI preview only, excluded from EPUB) */
  like_count?: number;
  /** Number of comments (UI preview only, excluded from EPUB) */
  comments_count?: number;
  /** Selection flag indicating whether this post is included in the EPUB */
  selected?: boolean;
}

/**
 * EPUB chapter sorting order.
 * - `asc`: Chronological order (Day 1 → Day 100, recommended for challenges).
 * - `desc`: Reverse chronological order (latest first).
 */
export type EpubSortOrder = "asc" | "desc";

/**
 * Available cover color theme identifiers.
 */
export type CoverThemeId = "navy" | "slate" | "ivory" | "white" | "purple";

/**
 * Visual design theme definition for EPUB cover generation.
 */
export interface CoverTheme {
  /** Unique theme identifier */
  id: CoverThemeId;
  /** Human-readable display label (e.g. "濃紺: チャレンジ") */
  name: string;
  /** Design concept description */
  description: string;
  /** Tailwind background color class */
  bgClass: string;
  /** Tailwind text color class */
  textClass: string;
  /** Tailwind accent/highlight color class */
  accentClass: string;
  /** Primary hex color code for preview swatch */
  previewBg: string;
  /** Accent hex color code for preview swatch */
  previewAccent: string;
}

/**
 * EPUB customization and styling settings configured in Step 3.
 */
export interface EpubCustomSettings {
  /** Book title displayed on the cover and EPUB metadata */
  title: string;
  /** Optional subtitle or challenge description */
  subtitle?: string;
  /** Author name / handle */
  author: string;
  /** Selected cover design theme */
  coverTheme: CoverThemeId;
  /** Content sorting order */
  sortOrder: EpubSortOrder;
  /** Contact information (e.g. email or social handle) */
  contact?: string;
  /** Author's Instagram profile URL */
  instagramUrl?: string;
}

/**
 * Structure of bundled demo feed data for instant preview mode.
 */
export interface DemoFeedData {
  /** Instagram username of the demo account */
  username: string;
  /** Account avatar image URL */
  avatarUrl: string;
  /** Demo challenge hashtag (e.g. "#100日チャレンジ") */
  hashtag: string;
  /** Array of mock feed posts */
  posts: FeedPostItem[];
}

/**
 * User account profile information for UI headers.
 */
export interface UserProfile {
  /** User identifier */
  id: string;
  /** Instagram username (without '@') */
  username?: string;
  /** Display name */
  displayName?: string;
  /** Profile picture URL */
  avatarUrl?: string;
}

/**
 * Status of the EPUB generation and download process.
 */
export type ExportStatus = "idle" | "generating" | "completed" | "error";

/**
 * Export modal state for tracking progress and errors.
 */
export interface ExportProgress {
  /** Current operation status */
  status: ExportStatus;
  /** Numeric progress indicator (0 - 100) */
  progress: number;
  /** Status description message */
  message: string;
  /** Error message if generation failed */
  error?: string;
  /** Generated EPUB download URL (object URL) */
  downloadUrl?: string;
}
