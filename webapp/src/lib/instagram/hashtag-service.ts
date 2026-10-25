/**
 * @file Instagram 投稿キャプションからのハッシュタグ抽出・集計サービス。
 *
 * 直近投稿のキャプションから日本語・英数字・アンダースコア・絵文字を含むハッシュタグを抽出し、
 * 1投稿内の重複排除・正規化・出現投稿数順ソートを行います。
 */
import type { HashtagSuggestion, InstagramMedia } from "@/lib/instagram/types";

/** ハッシュタグ候補返却件数のデフォルト上限 */
export const DEFAULT_HASHTAG_LIMIT = 20;
/** ハッシュタグ候補返却件数の最大上限 */
export const MAX_HASHTAG_LIMIT = 50;

/** キャプション内の URL を事前除去するための正規表現（URL フラグメント `#section` の誤抽出防止） */
const URL_PATTERN = /\bhttps?:\/\/\S+/giu;

/**
 * ハッシュタグ抽出用の Unicode 正規表現。
 * - 直前文字が語中文字（文字・数字・アンダースコア・`&`・`#`・`＃`）でない `#` または `＃` に続くトークンを抽出
 * - ゼロ幅後読み（Lookbehind）により `#tag1,#tag2` や `(#tag1)` の連続出現も取りこぼさない
 * - 日本語（ひらがな・カタカナ・漢字・長音符 `ー`）、英数字、結合文字、アンダースコア、絵文字に対応
 */
const HASHTAG_PATTERN =
  /(?<![\p{L}\p{M}\p{N}_&#＃])[#＃]((?:[\p{L}\p{M}\p{N}_\p{Extended_Pictographic}ー]|\uFE0F|\u200D)+)/gu;

/** アンダースコアのみで構成された無効トークン判定用 */
const ONLY_UNDERSCORES_PATTERN = /^_+$/;

export type ExtractHashtagsOptions = {
  /** 返却する最大候補件数（デフォルト: 20、最大: 50） */
  limit?: number;
};

/**
 * 単一キャプション文字列から正規化済みハッシュタグ一覧（重複なし）を抽出します。
 *
 * - 先頭の `#` / `＃` は除去します。
 * - NFC 正規化および英字小文字化を行います。
 * - 同一キャプション内に同じタグが複数回登場しても 1 回として返します。
 * - URL 内のフラグメント（例: `https://example.com/page#section`）は除外します。
 */
export function extractHashtagsFromCaption(caption?: string): string[] {
  if (!caption || typeof caption !== "string") {
    return [];
  }

  const normalizedText = caption.normalize("NFC").replace(URL_PATTERN, " ");
  const uniqueTags = new Set<string>();

  for (const match of normalizedText.matchAll(HASHTAG_PATTERN)) {
    const rawTag = match[1];
    if (!rawTag) {
      continue;
    }
    const normalizedTag = rawTag.normalize("NFC").toLowerCase();
    if (!normalizedTag || ONLY_UNDERSCORES_PATTERN.test(normalizedTag)) {
      continue;
    }
    uniqueTags.add(normalizedTag);
  }

  return Array.from(uniqueTags);
}

/**
 * クエリ等で指定された `limit` 値を安全な整数範囲（`1`〜`MAX_HASHTAG_LIMIT`）に正規化します。
 */
export function normalizeHashtagLimit(rawLimit?: number | string | null): number {
  if (rawLimit === undefined || rawLimit === null || rawLimit === "") {
    return DEFAULT_HASHTAG_LIMIT;
  }
  const parsed = typeof rawLimit === "number" ? rawLimit : Number(rawLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HASHTAG_LIMIT;
  }
  return Math.min(Math.floor(parsed), MAX_HASHTAG_LIMIT);
}

/**
 * 投稿一覧からハッシュタグ別の出現投稿数と最終使用日時を集計し、優先度順に返します。
 *
 * ソート順:
 * 1. `count`（出現投稿数）の降順
 * 2. 同数の場合は `lastUsedAt`（最終使用日時）の新しい順（降順）
 * 3. さらに同値の場合は `tag` の辞書順（昇順）
 */
export function extractHashtagsFromPosts(
  items: readonly Pick<InstagramMedia, "caption" | "timestamp">[],
  options?: ExtractHashtagsOptions,
): HashtagSuggestion[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const limit = normalizeHashtagLimit(options?.limit);
  const statsMap = new Map<string, { count: number; lastUsedAt: string; lastUsedMs: number }>();

  for (const item of items) {
    const tags = extractHashtagsFromCaption(item.caption);
    if (tags.length === 0) {
      continue;
    }

    const timestamp = item.timestamp || new Date(0).toISOString();
    const parsedMs = Date.parse(timestamp);
    const itemMs = Number.isFinite(parsedMs) ? parsedMs : -Infinity;

    for (const tag of tags) {
      const existing = statsMap.get(tag);
      if (!existing) {
        statsMap.set(tag, {
          count: 1,
          lastUsedAt: timestamp,
          lastUsedMs: itemMs,
        });
      } else {
        existing.count += 1;
        if (itemMs > existing.lastUsedMs) {
          existing.lastUsedAt = timestamp;
          existing.lastUsedMs = itemMs;
        }
      }
    }
  }

  return Array.from(statsMap.entries())
    .map(([tag, stat]) => ({
      tag,
      count: stat.count,
      lastUsedAt: stat.lastUsedAt,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      const bMs = Date.parse(b.lastUsedAt);
      const aMs = Date.parse(a.lastUsedAt);
      if (Number.isFinite(aMs) && Number.isFinite(bMs) && bMs !== aMs) {
        return bMs - aMs;
      }
      if (b.lastUsedAt !== a.lastUsedAt) {
        return b.lastUsedAt.localeCompare(a.lastUsedAt);
      }
      return a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0;
    })
    .slice(0, limit);
}
