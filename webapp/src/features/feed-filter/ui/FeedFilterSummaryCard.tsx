"use client";

import { ChevronDown } from "lucide-react";

/**
 * 折りたたみ済み絞り込み条件サマリーカードの Props。
 */
export interface FeedFilterSummaryCardProps {
  /** 1 行に整形済みの絞り込み条件サマリー文字列 */
  summaryText: string;
  /** 絞り込みフォームを再展開するハンドラ */
  onExpand: () => void;
}

/**
 * フィード取得完了後に Step 1 をコンパクト表示するサマリーカードコンポーネント。
 */
export function FeedFilterSummaryCard({ summaryText, onExpand }: FeedFilterSummaryCardProps) {
  return (
    <section
      className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all hover:border-slate-300"
      aria-label="フィード絞り込み条件サマリー"
    >
      <button
        type="button"
        onClick={onExpand}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-2xl"
        aria-expanded={false}
        aria-label={`絞り込み条件を展開: ${summaryText}`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            1
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wide block uppercase">
              絞り込み条件
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate m-0">
              {summaryText}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 shrink-0 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition">
          <span>条件を変更</span>
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </button>
    </section>
  );
}
