/**
 * @file FeedPostItem (API構造) から UI 表示用 ViewModel への変換プレゼンター。
 */
import { formatDateTimeJP } from "@/lib/format/date";
import { listCarouselMediaEntries, resolveMediaDisplayUrl } from "@/lib/instagram/media-resolver";
import type { FeedPostItem } from "@/types/ui";

/**
 * カルーセル内の個別写真向け表示モデル。
 */
export interface CarouselPhotoViewModel {
  id: string;
  url: string;
  selected: boolean;
}

/**
 * 投稿カード UI が受け取る表示専用 ViewModel。
 */
export interface PostCardViewModel {
  id: string;
  selected: boolean;
  thumbnailUrl?: string;
  formattedDate: string;
  isoTimestamp: string;
  caption: string;
  permalink?: string;
  likeCount?: number;
  carouselPhotos: CarouselPhotoViewModel[];
}

/**
 * API 寄りの投稿データを投稿カード表示用の ViewModel へ変換します。
 */
export function toPostCardViewModel(post: FeedPostItem): PostCardViewModel {
  const isSelected = post.selected !== false;
  const carouselEntries = listCarouselMediaEntries(post);
  const selectedChildSet =
    post.selectedChildIds !== undefined ? new Set(post.selectedChildIds) : null;

  const carouselPhotos: CarouselPhotoViewModel[] =
    carouselEntries.length > 1
      ? carouselEntries.map((entry) => ({
          id: entry.id,
          url: entry.url,
          selected: isSelected && (selectedChildSet ? selectedChildSet.has(entry.id) : true),
        }))
      : [];

  const firstSelectedPhotoUrl = carouselPhotos.find((photo) => photo.selected)?.url;
  const thumbnailUrl = firstSelectedPhotoUrl ?? resolveMediaDisplayUrl(post);

  return {
    id: post.id,
    selected: isSelected,
    thumbnailUrl,
    formattedDate: formatDateTimeJP(post.timestamp),
    isoTimestamp: post.timestamp,
    caption: post.caption?.trim() || "(キャプションなし)",
    permalink: post.permalink,
    likeCount: typeof post.like_count === "number" ? post.like_count : undefined,
    carouselPhotos,
  };
}
