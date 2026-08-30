/**
 * @file Instagram Media テスト用フィクスチャ
 */
import type { InstagramMedia } from "@/lib/instagram/types";

/**
 * 基本的な InstagramMedia モックデータ
 */
export const mockMediaBasic: InstagramMedia = {
  id: "17895695668004550",
  caption: "A simple post #test",
  media_type: "IMAGE",
  media_url: "https://example.com/image.jpg",
  permalink: "https://www.instagram.com/p/ABC123/",
  timestamp: "2025-01-15T10:30:00Z",
};

/**
 * 特殊文字を含む InstagramMedia モックデータ
 * XMLエスケープが必要な文字（&, <, >, ", '）を含む
 */
export const mockMediaWithSpecialChars: InstagramMedia = {
  id: "17895695668004551",
  caption: 'Post with <html> & "quotes" in caption',
  media_type: "IMAGE",
  media_url: "https://example.com/image.jpg?token=abc&size=large",
  permalink: "https://www.instagram.com/p/DEF456/?utm_source=test&ref=share",
  timestamp: "2025-01-16T14:00:00Z",
};

/**
 * キャプションなしの InstagramMedia モックデータ
 */
export const mockMediaNoCaption: InstagramMedia = {
  id: "17895695668004552",
  media_type: "IMAGE",
  media_url: "https://example.com/image2.jpg",
  permalink: "https://www.instagram.com/p/GHI789/",
  timestamp: "2025-01-17T08:00:00Z",
};

/**
 * 改行と絵文字を含む InstagramMedia モックデータ
 */
export const mockMediaWithNewlines: InstagramMedia = {
  id: "17895695668004553",
  caption: "Line 1\nLine 2\n\nLine 4 with emoji 🎉",
  media_type: "IMAGE",
  media_url: "https://example.com/image3.jpg",
  permalink: "https://www.instagram.com/p/JKL012/",
  timestamp: "2025-01-18T16:00:00Z",
};

/**
 * 長いキャプションを含む InstagramMedia モックデータ
 */
export const mockMediaWithLongCaption: InstagramMedia = {
  id: "17895695668004554",
  caption:
    "This is a very long caption that exceeds 32 characters and should be truncated in the chapter title while preserving the full content in the body #test #longcaption",
  media_type: "IMAGE",
  media_url: "https://example.com/image4.jpg",
  permalink: "https://www.instagram.com/p/MNO345/",
  timestamp: "2025-01-19T12:00:00Z",
};

/**
 * 全フィクスチャの配列
 */
export const allMockMedia: InstagramMedia[] = [
  mockMediaBasic,
  mockMediaWithSpecialChars,
  mockMediaNoCaption,
  mockMediaWithNewlines,
  mockMediaWithLongCaption,
];
