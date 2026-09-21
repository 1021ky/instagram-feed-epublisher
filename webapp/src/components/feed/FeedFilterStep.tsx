/**
 * @file Step 1: フィード絞り込みフォームコンポーネント
 * ハッシュタグ、期間プリセット、最大件数スライダーの指定と、
 * 取得完了後のコンパクトなサマリー自動折りたたみ・再展開機能を提供します。
 */
"use client";

import { useId, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Hash,
  Loader2,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { DatePreset, FeedFilterOptions } from "@/types/ui";

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換します。
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * プリセットに応じた日付範囲を計算します。
 */
export function calculatePresetDates(
  preset: DatePreset,
  baseDate: Date = new Date(),
): {
  startDate?: string;
  endDate?: string;
} {
  const todayStr = formatDateToISO(baseDate);

  if (preset === "100days") {
    const start = new Date(baseDate.getTime());
    start.setDate(start.getDate() - 100);
    return { startDate: formatDateToISO(start), endDate: todayStr };
  }

  if (preset === "30days") {
    const start = new Date(baseDate.getTime());
    start.setDate(start.getDate() - 30);
    return { startDate: formatDateToISO(start), endDate: todayStr };
  }

  if (preset === "all") {
    return { startDate: undefined, endDate: undefined };
  }

  return {};
}

/**
 * 現在の日付設定からプリセット種別を判定します。
 */
export function detectPreset(
  startDate?: string,
  endDate?: string,
  baseDate: Date = new Date(),
): DatePreset {
  if (!startDate && !endDate) {
    return "all";
  }

  const p100 = calculatePresetDates("100days", baseDate);
  if (startDate === p100.startDate && endDate === p100.endDate) {
    return "100days";
  }

  const p30 = calculatePresetDates("30days", baseDate);
  if (startDate === p30.startDate && endDate === p30.endDate) {
    return "30days";
  }

  return "custom";
}

/**
 * おすすめハッシュタグのデフォルト候補。
 */
export const DEFAULT_SUGGESTED_TAGS = [
  "#100日チャレンジ",
  "#成長記録",
  "#写真好きな人と繋がりたい",
  "#travel",
  "#イラスト",
];

export interface FeedFilterStepProps {
  /** フィルター設定値 */
  filter: FeedFilterOptions;
  /** フィルター設定更新ハンドラ */
  onFilterChange: (filter: FeedFilterOptions) => void;
  /** フィード取得実行ハンドラ */
  onSubmit: () => void | Promise<void>;
  /** 取得処理中のフラグ */
  isLoading?: boolean;
  /** エラーメッセージ（存在する場合） */
  error?: string | null;
  /** 取得済み件数（サマリー表示用） */
  fetchedCount?: number;
  /** 折りたたみ状態（指定時は外部制御、省略時は自動/内部制御） */
  isCollapsed?: boolean;
  /** 折りたたみ状態変更ハンドラ */
  onToggleCollapse?: () => void;
  /** おすすめハッシュタグ一覧 */
  suggestedTags?: string[];
  /** 「条件変更」ボタンの表示制御（サマリー表示時） */
  disabled?: boolean;
}

/**
 * Step 1 絞り込みフォームコンポーネント。
 */
export function FeedFilterStep({
  filter,
  onFilterChange,
  onSubmit,
  isLoading = false,
  error = null,
  fetchedCount,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  suggestedTags = DEFAULT_SUGGESTED_TAGS,
  disabled = false,
}: FeedFilterStepProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // 外部からの制御があればそれを優先、なければ内部ステート
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed((prev) => !prev));

  const hashtagId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const maxCountId = useId();

  // 現在の日付プリセット判定
  const activePreset = useMemo(() => {
    return detectPreset(filter.startDate, filter.endDate);
  }, [filter.startDate, filter.endDate]);

  // プリセット適用ハンドラ
  const handlePresetSelect = (preset: DatePreset) => {
    const dates = calculatePresetDates(preset);
    onFilterChange({
      ...filter,
      startDate: dates.startDate,
      endDate: dates.endDate,
    });
  };

  // タグ候補選択ハンドラ
  const handleTagClick = (tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
    const currentClean = filter.hashtag?.startsWith("#") ? filter.hashtag.slice(1) : filter.hashtag;

    // 既に選択されていたら解除、別タグなら上書き
    if (currentClean === cleanTag) {
      onFilterChange({ ...filter, hashtag: undefined });
    } else {
      onFilterChange({ ...filter, hashtag: cleanTag });
    }
  };

  // サマリーテキストの生成
  const summaryText = useMemo(() => {
    const tagLabel = filter.hashtag ? `#${filter.hashtag.replace(/^#/, "")}` : "すべてのタグ";

    let dateLabel = "全期間";
    if (activePreset === "100days") {
      dateLabel = "直近100日";
    } else if (activePreset === "30days") {
      dateLabel = "直近30日";
    } else if (filter.startDate || filter.endDate) {
      dateLabel = `${filter.startDate || "開始"} 〜 ${filter.endDate || "今日"}`;
    }

    const countLabel =
      typeof fetchedCount === "number" ? `${fetchedCount}件取得中` : `最大${filter.maxCount}件`;

    return `${tagLabel} / ${dateLabel} / ${countLabel}`;
  }, [filter, activePreset, fetchedCount]);

  // 取得完了時のサマリーカード表示（折りたたまれている場合）
  if (isCollapsed) {
    return (
      <section
        className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300"
        aria-label="フィード絞り込み条件サマリー"
      >
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl"
          aria-expanded={false}
          aria-label={`絞り込み条件を展開: ${summaryText}`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Filter className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                絞り込み条件
              </span>
              <p className="text-sm font-medium text-slate-800 truncate">{summaryText}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0 bg-slate-100 px-3 py-2 rounded-lg">
            <span>条件を変更</span>
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </button>
      </section>
    );
  }

  return (
    <section
      className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 transition-all"
      aria-label="フィード絞り込みフォーム"
    >
      {/* フォームヘッダー */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Filter className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 1: フィードの絞り込み</h2>
            <p className="text-xs text-slate-500">
              ハッシュタグや期間を指定してInstagramから投稿を取得します
            </p>
          </div>
        </div>

        {typeof fetchedCount === "number" && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 min-h-[44px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="絞り込み条件を折りたたむ"
          >
            <span>閉じる</span>
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isLoading && !disabled) {
            void onSubmit();
          }
        }}
        className="space-y-5"
      >
        {/* 1. ハッシュタグ入力 */}
        <div className="space-y-2">
          <label
            htmlFor={hashtagId}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"
          >
            <Hash className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>ハッシュタグ絞り込み</span>
            <span className="text-xs font-normal text-slate-400">（任意）</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
              #
            </span>
            <input
              id={hashtagId}
              type="text"
              placeholder="100日チャレンジ"
              value={filter.hashtag ? filter.hashtag.replace(/^#/, "") : ""}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  hashtag: e.target.value ? e.target.value.replace(/^#/, "") : undefined,
                })
              }
              className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[44px]"
            />
          </div>

          {/* おすすめタグボタン */}
          {suggestedTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" aria-hidden="true" />
                人気タグ:
              </span>
              {suggestedTags.map((tag) => {
                const clean = tag.replace(/^#/, "");
                const isSelected = filter.hashtag?.replace(/^#/, "") === clean;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                    }`}
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 期間指定 & プリセット */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>期間指定</span>
            </span>

            {/* プリセットボタン */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handlePresetSelect("100days")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition min-h-[44px] sm:min-h-[36px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  activePreset === "100days"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                直近100日
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("30days")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition min-h-[44px] sm:min-h-[36px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  activePreset === "30days"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                直近30日
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition min-h-[44px] sm:min-h-[36px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  activePreset === "all"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                全期間
              </button>
            </div>
          </div>

          {/* 開始日・終了日入力 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={startDateId} className="text-xs font-medium text-slate-500">
                開始日
              </label>
              <input
                id={startDateId}
                type="date"
                value={filter.startDate ?? ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    startDate: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={endDateId} className="text-xs font-medium text-slate-500">
                終了日
              </label>
              <input
                id={endDateId}
                type="date"
                value={filter.endDate ?? ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    endDate: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* 3. 最大取得件数スライダー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor={maxCountId}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"
            >
              <Sliders className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>最大取得件数</span>
            </label>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
              {filter.maxCount} 件
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium shrink-0">10</span>
            <input
              id={maxCountId}
              type="range"
              min={10}
              max={500}
              step={10}
              value={filter.maxCount}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  maxCount: Number(e.target.value),
                })
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
            />
            <span className="text-xs text-slate-400 font-medium shrink-0">500</span>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2"
          >
            <span className="font-bold">✕</span>
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* 取得アクションボタン */}
        <button
          type="submit"
          disabled={isLoading || disabled}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm transition min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>投稿を取得中...</span>
            </>
          ) : (
            <>
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span>この条件で投稿を取得</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
