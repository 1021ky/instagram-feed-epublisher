/**
 * @file Step 2: 投稿カードコンポーネント (PostCard)
 * モバイル向け縦1列のカードレイアウトで、サムネイル画像、日付、キャプション冒頭、
 * いいね数、Instagram外部リンクを表示し、EPUBへの収録/除外を直感的にトグルできます。
 */
"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Calendar, Check, ExternalLink, Heart, ImageIcon } from "lucide-react";
import type { FeedPostItem } from "@/types/ui";

/**
 * ISO 8601 の日時文字列を読みやすい日本語形式に変換します。
 */
export function formatPostDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${y}/${m}/${d} ${h}:${min}`;
  } catch {
    return isoString;
  }
}

export interface PostCardProps {
  /** 投稿アイテム */
  post: FeedPostItem;
  /** 選択状態の変更コールバック */
  onToggleSelect: (postId: string) => void;
  /** 連番（1から始まるインデックス、オプショナル） */
  index?: number;
}

/**
 * 投稿カードコンポーネント。
 */
export function PostCard({ post, onToggleSelect, index }: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const checkboxId = useId();

  // 選択状態（デフォルトは true として扱う）
  const isSelected = post.selected !== false;

  const handleCardClick = () => {
    onToggleSelect(post.id);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(post.id);
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formattedDate = formatPostDate(post.timestamp);
  const captionText = post.caption?.trim() || "(キャプションなし)";

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? "bg-white border-slate-300 ring-1 ring-slate-200 shadow-xs"
          : "bg-slate-50/80 border-slate-200 opacity-60 hover:opacity-85"
      }`}
      aria-label={`投稿: ${formattedDate} - ${captionText.slice(0, 30)}`}
    >
      {/* 1. チェックボックス領域（44x44px 以上のタップ可能領域を確保） */}
      <div className="shrink-0 pt-0.5">
        <button
          type="button"
          id={checkboxId}
          role="checkbox"
          aria-checked={isSelected}
          onClick={handleCheckboxClick}
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400`}
          aria-label={isSelected ? "この投稿をEPUBから除外" : "この投稿をEPUBに収録"}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition border ${
              isSelected
                ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                : "bg-white border-slate-300 text-transparent group-hover:border-slate-400"
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          </div>
        </button>
      </div>

      {/* 2. サムネイル画像 */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
        {index !== undefined && (
          <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 bg-slate-900/70 text-white text-[10px] font-bold rounded-md backdrop-blur-xs">
            #{index}
          </span>
        )}

        {!imageError && post.media_url ? (
          <Image
            src={post.media_url}
            alt={captionText.slice(0, 50)}
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

      {/* 3. 投稿テキスト・メタデータ */}
      <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
        {/* 投稿日時 & Instagramリンク */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <time dateTime={post.timestamp}>{formattedDate}</time>
          </span>

          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalLinkClick}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition min-h-[32px] px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              title="Instagramで元の投稿を開く"
              aria-label="Instagramで元の投稿を開く"
            >
              <span>表示</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* キャプション本文（2〜3行でクランプ） */}
        <p className="text-xs sm:text-sm text-slate-700 leading-snug line-clamp-2 sm:line-clamp-3 break-words font-normal">
          {captionText}
        </p>

        {/* 下部メタデータ: いいね数 & 選択バッジ */}
        <div className="flex items-center gap-3 pt-0.5">
          {typeof post.like_count === "number" && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md"
              title={`いいね: ${post.like_count}件`}
            >
              <Heart className="w-3 h-3 fill-rose-500" aria-hidden="true" />
              <span>{post.like_count.toLocaleString()}</span>
            </span>
          )}

          <span
            className={`text-[11px] ${isSelected ? "text-slate-800 font-bold" : "text-slate-400"}`}
          >
            {isSelected ? "収録対象" : "除外"}
          </span>
        </div>
      </div>
    </article>
  );
}
