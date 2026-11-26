"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { CarouselPhotoViewModel } from "../model/post-presenter";

/**
 * カルーセル個別写真選択リストコンポーネントの Props。
 */
export interface CarouselPhotoStripProps {
  /** カルーセル内の写真一覧 */
  photos: CarouselPhotoViewModel[];
  /** 個別写真の選択トグルコールバック */
  onTogglePhoto?: (photoId: string) => void;
}

/**
 * カルーセル投稿の写真一覧を横スクロール可能なチェックリストとして描画します。
 */
export function CarouselPhotoStrip({ photos, onTogglePhoto }: CarouselPhotoStripProps) {
  if (photos.length <= 1) {
    return null;
  }

  const selectedCount = photos.filter((photo) => photo.selected).length;

  return (
    <div
      className="pt-2 mt-2 border-t border-slate-100 space-y-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[11px] font-semibold text-slate-500 m-0">
        収録する写真を選択（{selectedCount}/{photos.length}枚）
      </p>
      <div
        role="group"
        aria-label="カルーセル画像の収録選択"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            type="button"
            role="checkbox"
            aria-checked={photo.selected}
            aria-label={`画像 ${idx + 1} を${photo.selected ? "EPUBから除外" : "EPUBに収録"}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePhoto?.(photo.id);
            }}
            className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 min-h-[44px] min-w-[44px] rounded-lg overflow-hidden border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 ${
              photo.selected
                ? "border-slate-900 ring-1 ring-slate-900"
                : "border-slate-200 opacity-45 grayscale"
            }`}
          >
            <Image
              src={photo.url}
              alt={`カルーセル画像 ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="object-cover"
              unoptimized
            />
            <span
              aria-hidden="true"
              className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center ${
                photo.selected
                  ? "bg-slate-900 text-white"
                  : "bg-white/90 border border-slate-300 text-transparent"
              }`}
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
