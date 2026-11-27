/**
 * @file 投稿カード1件の選択チェック・サムネイル・日時/元投稿リンク・キャプション・いいね数・カルーセル写真選択を束ねて描画し、カードタップで収録対象を切り替える。
 */
"use client";

import { useId } from "react";
import { SelectionCheckbox } from "@/components/atoms";
import type { PostCardViewModel } from "../model/post-presenter";
import { CarouselPhotoStrip } from "./CarouselPhotoStrip";
import { PostFooterStatus } from "./PostFooterStatus";
import { PostMetaHeader } from "./PostMetaHeader";
import { PostThumbnail } from "./PostThumbnail";

/**
 * 投稿カードコンポーネントの Props。
 */
export interface PostCardProps {
  /** 投稿カード表示用の正規化済み ViewModel */
  post: PostCardViewModel;
  /** 投稿全体の選択トグルコールバック */
  onToggleSelect: (postId: string) => void;
  /** カルーセル個別写真の選択トグルコールバック */
  onToggleChildSelect?: (postId: string, childId: string) => void;
  /** 表示連番（1始まり、任意） */
  index?: number;
}

/**
 * 投稿カードコンポーネント。
 */
export function PostCard({ post, onToggleSelect, onToggleChildSelect, index }: PostCardProps) {
  const checkboxId = useId();
  const selectedPhotosCount = post.carouselPhotos.filter((photo) => photo.selected).length;

  return (
    <article
      onClick={() => onToggleSelect(post.id)}
      className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        post.selected
          ? "bg-white border-slate-300 ring-1 ring-slate-200 shadow-xs"
          : "bg-slate-50/80 border-slate-200 opacity-60 hover:opacity-85"
      }`}
      aria-label={`投稿: ${post.formattedDate} - ${post.caption.slice(0, 30)}`}
    >
      <SelectionCheckbox
        id={checkboxId}
        checked={post.selected}
        label={post.selected ? "この投稿をEPUBから除外" : "この投稿をEPUBに収録"}
        onToggle={() => onToggleSelect(post.id)}
      />

      <PostThumbnail
        src={post.thumbnailUrl}
        alt={post.caption.slice(0, 50)}
        index={index}
        selectedCarouselCount={selectedPhotosCount}
        totalCarouselCount={post.carouselPhotos.length}
      />

      <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
        <PostMetaHeader
          formattedDate={post.formattedDate}
          isoTimestamp={post.isoTimestamp}
          permalink={post.permalink}
        />

        <p className="text-xs sm:text-sm text-slate-700 leading-snug line-clamp-2 sm:line-clamp-3 break-words font-normal">
          {post.caption}
        </p>

        <PostFooterStatus likeCount={post.likeCount} selected={post.selected} />

        <CarouselPhotoStrip
          photos={post.carouselPhotos}
          onTogglePhoto={(photoId) => onToggleChildSelect?.(post.id, photoId)}
        />
      </div>
    </article>
  );
}
