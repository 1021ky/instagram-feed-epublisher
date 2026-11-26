"use client";

import type React from "react";
import { Calendar, ExternalLink } from "lucide-react";

/**
 * 投稿カード上部のメタ情報ヘッダー（投稿日時・元投稿リンク）の Props。
 */
export interface PostMetaHeaderProps {
  /** 表示用に整形済みの日時文字列 */
  formattedDate: string;
  /** time 要素の dateTime 属性用 ISO 文字列 */
  isoTimestamp: string;
  /** 元の Instagram 投稿 URL（任意） */
  permalink?: string;
}

/**
 * 投稿日時と元投稿への外部リンク行を描画します。
 */
export function PostMetaHeader({ formattedDate, isoTimestamp, permalink }: PostMetaHeaderProps) {
  const handleExternalLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
        <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        <time dateTime={isoTimestamp}>{formattedDate}</time>
      </span>

      {permalink && (
        <a
          href={permalink}
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
  );
}
