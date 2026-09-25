/**
 * @file Step 1: フィード絞り込みフォームコンポーネント
 * ハッシュタグ、期間プリセット、最大件数スライダーの指定と、
 * 取得完了後のコンパクトなサマリー自動折りたたみ・再展開機能を提供します。
 */
"use client";

import { useId, useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Filter, Hash, Loader2 } from "lucide-react";
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
  /** 「条件変更」ボタンの表示制御（サマリー表示時） */
  disabled?: boolean;
  /** デモモードフラグ（変更不可・案内表示） */
  isDemoMode?: boolean;
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
  disabled = false,
  isDemoMode = false,
}: FeedFilterStepProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const handleDemoBlocked = () => {
    setShowDemoNotice(true);
  };

  // 外部からの制御があればそれを優先、なければ内部ステート
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed((prev) => !prev));

  const hashtagId = useId();
  const startDateId = useId();
  const endDateId = useId();

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
        className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all hover:border-slate-300"
        aria-label="フィード絞り込み条件サマリー"
      >
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-2xl"
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

  return (
    <section
      className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 transition-all"
      aria-label="フィード絞り込みフォーム"
    >
      {/* フォームヘッダー */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            1
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 m-0">
              Step 1: フィードの絞り込み
            </h2>
            <p className="text-xs text-slate-500 m-0">
              ハッシュタグや期間を指定してInstagramから投稿を取得します（最大200件）
            </p>
          </div>
        </div>

        {typeof fetchedCount === "number" && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 min-h-[44px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-lg"
            aria-label="絞り込み条件を折りたたむ"
          >
            <span>閉じる</span>
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* デモ体験モード案内バナー */}
      {isDemoMode && (
        <div
          role="status"
          className={`mb-4 p-3 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 transition-all ${
            showDemoNotice
              ? "bg-amber-50 border border-amber-300 text-amber-900 shadow-xs"
              : "bg-blue-50/70 border border-blue-100 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0" aria-hidden="true">
              {showDemoNotice ? "⚠️" : "💡"}
            </span>
            <span className="font-medium">
              {showDemoNotice
                ? "デモ体験中は条件を変更できません（ログイン後に自由に変更できます）"
                : "デモ体験モード：条件は固定サンプルです（ログイン後に自由に変更できます）"}
            </span>
          </div>
          {showDemoNotice && (
            <button
              type="button"
              onClick={() => setShowDemoNotice(false)}
              className="text-amber-700 hover:text-amber-900 p-1 rounded-md text-xs font-bold shrink-0 cursor-pointer"
              aria-label="案内を閉じる"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isDemoMode) {
            handleDemoBlocked();
            return;
          }
          if (!isLoading && !disabled) {
            void onSubmit();
          }
        }}
        className="space-y-5"
      >
        {/* 1. ハッシュタグ入力 */}
        <div className="space-y-1.5">
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
              readOnly={isDemoMode}
              onClick={isDemoMode ? handleDemoBlocked : undefined}
              onFocus={isDemoMode ? handleDemoBlocked : undefined}
              onChange={(e) => {
                if (isDemoMode) {
                  handleDemoBlocked();
                  return;
                }
                onFilterChange({
                  ...filter,
                  hashtag: e.target.value ? e.target.value.replace(/^#/, "") : undefined,
                });
              }}
              className={`w-full pl-8 pr-4 py-2.5 text-sm rounded-xl outline-none transition min-h-[44px] ${
                isDemoMode
                  ? "bg-slate-100/70 border border-slate-200 text-slate-600 cursor-not-allowed select-none"
                  : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-400 m-0">
            ご自身のアカウントでつけたハッシュタグを入力してください（未入力の場合は全投稿が対象になります）。
          </p>
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
                onClick={isDemoMode ? handleDemoBlocked : () => handlePresetSelect("100days")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition min-h-[44px] sm:min-h-[36px] focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  isDemoMode ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  activePreset === "100days"
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                直近100日
              </button>
              <button
                type="button"
                onClick={isDemoMode ? handleDemoBlocked : () => handlePresetSelect("30days")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition min-h-[44px] sm:min-h-[36px] focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  isDemoMode ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  activePreset === "30days"
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                直近30日
              </button>
              <button
                type="button"
                onClick={isDemoMode ? handleDemoBlocked : () => handlePresetSelect("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition min-h-[44px] sm:min-h-[36px] focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  isDemoMode ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  activePreset === "all"
                    ? "bg-white text-slate-900 font-bold shadow-xs"
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
                readOnly={isDemoMode}
                onClick={isDemoMode ? handleDemoBlocked : undefined}
                onFocus={isDemoMode ? handleDemoBlocked : undefined}
                onKeyDown={
                  isDemoMode
                    ? (e) => {
                        e.preventDefault();
                        handleDemoBlocked();
                      }
                    : undefined
                }
                onChange={(e) => {
                  if (isDemoMode) {
                    handleDemoBlocked();
                    return;
                  }
                  onFilterChange({
                    ...filter,
                    startDate: e.target.value || undefined,
                  });
                }}
                className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition min-h-[44px] ${
                  isDemoMode
                    ? "bg-slate-100/70 border border-slate-200 text-slate-600 cursor-not-allowed"
                    : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                }`}
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
                readOnly={isDemoMode}
                onClick={isDemoMode ? handleDemoBlocked : undefined}
                onFocus={isDemoMode ? handleDemoBlocked : undefined}
                onKeyDown={
                  isDemoMode
                    ? (e) => {
                        e.preventDefault();
                        handleDemoBlocked();
                      }
                    : undefined
                }
                onChange={(e) => {
                  if (isDemoMode) {
                    handleDemoBlocked();
                    return;
                  }
                  onFilterChange({
                    ...filter,
                    endDate: e.target.value || undefined,
                  });
                }}
                className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition min-h-[44px] ${
                  isDemoMode
                    ? "bg-slate-100/70 border border-slate-200 text-slate-600 cursor-not-allowed"
                    : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                }`}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 m-0">
            ※ 1回の取得で最大200件の投稿を自動取得します。
          </p>
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
          type={isDemoMode ? "button" : "submit"}
          onClick={isDemoMode ? handleDemoBlocked : undefined}
          disabled={isLoading || (!isDemoMode && disabled)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs transition min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
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
