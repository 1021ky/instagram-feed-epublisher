/**
 * @file 投稿カードのサムネイル領域（連番・複数枚バッジ・画像読み込みフォールバック）
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Layers } from "lucide-react";

export interface PostThumbnailProps {
  /** 表示画像 URL */
  src?: string;
  /** 代替テキスト */
  alt: string;
  /** 投稿連番（1始まり、任意） */
  index?: number;
  /** カルーセル内の選択枚数 */
  selectedCarouselCount?: number;
  /** カルーセルの総枚数 */
  totalCarouselCount?: number;
}

/**
 * 投稿サムネイル領域を描画します。
 */
export function PostThumbnail({
  src,
  alt,
  index,
  selectedCarouselCount,
  totalCarouselCount,
}: PostThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const showCarouselBadge =
    typeof totalCarouselCount === "number" &&
    totalCarouselCount > 1 &&
    typeof selectedCarouselCount === "number";

  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
      {index !== undefined && (
        <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 bg-slate-900/70 text-white text-[10px] font-bold rounded-md backdrop-blur-xs">
          #{index}
        </span>
      )}

      {showCarouselBadge && (
        <span className="absolute bottom-1 right-1 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900/75 text-white text-[10px] font-bold rounded-md backdrop-blur-xs">
          <Layers className="w-2.5 h-2.5" aria-hidden="true" />
          <span>
            {selectedCarouselCount}/{totalCarouselCount}枚
          </span>
        </span>
      )}

      {!imageError && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 80px, 96px"
          className="object-cover transition group-hover:scale-105 duration-200"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
          <ImageIcon className="w-6 h-6 mb-1" aria-hidden="true" />
          <span className="text-[10px] text-center">画像なし</span>
        </div>
      )}
    </div>
  );
}
