/**
 * @file Instagram メディア（画像・動画・カルーセル）から表示・EPUB収録用の画像URLを解決する純粋関数群。
 */
import type { InstagramMedia, InstagramMediaChild } from "@/lib/instagram/types";

type ResolvableMedia = Pick<
  InstagramMedia,
  "id" | "media_type" | "media_url" | "thumbnail_url" | "children"
>;

/**
 * カルーセル展開後の各画像エントリ。
 */
export type CarouselMediaEntry = {
  id: string;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  index: number;
};

/**
 * EPUB の 1 ページ分に相当する解決済み画像情報。
 */
export type ResolvedEpubImage = {
  id: string;
  url: string;
  childIndex: number;
  totalCount: number;
};

/**
 * カルーセル子要素 1 件から表示・取得可能な画像 URL を解決します。
 * 動画子要素の場合は動画本体 (.mp4 等) ではなく thumbnail_url のみを採用します。
 */
export function resolveChildDisplayUrl(child: InstagramMediaChild): string | undefined {
  if (child.media_type === "VIDEO") {
    return child.thumbnail_url || undefined;
  }
  return child.media_url || child.thumbnail_url || undefined;
}

/**
 * 投稿 1 件からサムネイル表示用の代表画像 URL を解決します。
 */
export function resolveMediaDisplayUrl(item: ResolvableMedia): string | undefined {
  if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data?.length) {
    for (const child of item.children.data) {
      const childUrl = resolveChildDisplayUrl(child);
      if (childUrl) {
        return childUrl;
      }
    }
    return item.media_url || item.thumbnail_url || undefined;
  }

  if (item.media_type === "VIDEO") {
    return item.thumbnail_url || undefined;
  }

  return item.media_url || item.thumbnail_url || undefined;
}

/**
 * カルーセル投稿から有効な画像 URL を持つ子要素一覧を投稿内順序で抽出します。
 */
export function listCarouselMediaEntries(item: ResolvableMedia): CarouselMediaEntry[] {
  if (item.media_type !== "CAROUSEL_ALBUM" || !item.children?.data?.length) {
    return [];
  }

  const entries: CarouselMediaEntry[] = [];
  for (const [index, child] of item.children.data.entries()) {
    const url = resolveChildDisplayUrl(child);
    if (url) {
      entries.push({
        id: child.id,
        url,
        mediaType: child.media_type,
        index,
      });
    }
  }
  return entries;
}

/**
 * EPUB 生成向けに投稿から収録対象画像の一覧（1ページ1画像）を解決します。
 */
export function resolveMediaImagesForEpub(
  item: ResolvableMedia,
  selectedChildIds?: string[],
): ResolvedEpubImage[] {
  if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data?.length) {
    const entries = listCarouselMediaEntries(item);
    const selectedSet = selectedChildIds !== undefined ? new Set(selectedChildIds) : null;
    const filtered = selectedSet ? entries.filter((entry) => selectedSet.has(entry.id)) : entries;

    if (filtered.length > 0) {
      return filtered.map((entry, idx) => ({
        id: entry.id,
        url: entry.url,
        childIndex: idx,
        totalCount: filtered.length,
      }));
    }

    if (selectedSet !== null) {
      return [];
    }
  }

  const singleUrl = resolveMediaDisplayUrl(item);
  if (!singleUrl) {
    return [];
  }

  return [
    {
      id: item.id,
      url: singleUrl,
      childIndex: 0,
      totalCount: 1,
    },
  ];
}
