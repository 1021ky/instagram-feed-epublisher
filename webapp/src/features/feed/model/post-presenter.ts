import { formatDateTimeJP } from "@/lib/format/date";
import { listCarouselMediaEntries, resolveMediaDisplayUrl } from "@/lib/instagram/media-resolver";
import type { FeedPostItem } from "@/types/ui";

/**
 * カルーセル内の個別写真向け表示モデル。
 */
export interface CarouselPhotoViewModel {
  /** 子メディア ID */
  id: string;
  /** 表示用画像 URL */
  url: string;
  /** EPUB 収録対象として選択中か */
  selected: boolean;
}

/**
 * 投稿カード UI が受け取る表示専用 ViewModel。
 */
export interface PostCardViewModel {
  /** 投稿 ID */
  id: string;
  /** 投稿全体が収録対象として選択中か */
  selected: boolean;
  /** カード左側に表示する代表サムネイル URL */
  thumbnailUrl?: string;
  /** 日本語フォーマット済みの投稿日時文字列 */
  formattedDate: string;
  /** time 要素の dateTime 属性向け ISO タイムスタンプ */
  isoTimestamp: string;
  /** 表示用に正規化されたキャプション本文 */
  caption: string;
  /** 元の Instagram 投稿 URL */
  permalink?: string;
  /** いいね数（存在する場合） */
  likeCount?: number;
  /** カルーセル個別写真一覧（2 枚以上の場合のみ格納） */
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
