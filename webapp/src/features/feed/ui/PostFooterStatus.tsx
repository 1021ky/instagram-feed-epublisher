"use client";

import { Heart } from "lucide-react";

/**
 * 投稿カード下部のステータス表示（いいね数・収録対象ラベル）の Props。
 */
export interface PostFooterStatusProps {
  /** いいね数（UI表示専用、EPUB非出力） */
  likeCount?: number;
  /** 収録対象フラグ */
  selected: boolean;
}

/**
 * 投稿カードのいいね数バッジと収録対象ステータスを描画します。
 */
export function PostFooterStatus({ likeCount, selected }: PostFooterStatusProps) {
  return (
    <div className="flex items-center gap-3 pt-0.5">
      {typeof likeCount === "number" && (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md"
          title={`いいね: ${likeCount}件`}
        >
          <Heart className="w-3 h-3 fill-rose-500" aria-hidden="true" />
          <span>{likeCount.toLocaleString()}</span>
        </span>
      )}

      <span className={`text-[11px] ${selected ? "text-slate-800 font-bold" : "text-slate-400"}`}>
        {selected ? "収録対象" : "除外"}
      </span>
    </div>
  );
}
