"use client";

import { useMemo, useState } from "react";
import { ChevronUp, Filter, Loader2 } from "lucide-react";
import { ActionButton } from "@/components/atoms";
import { AlertBanner, StepCardHeader } from "@/components/molecules";
import type { FeedFilterOptions, HashtagSuggestion } from "@/types/ui";
import {
  calculatePresetDates,
  detectPreset,
  type SelectableDatePreset,
} from "../model/date-preset";
import { formatFilterSummary } from "../model/filter-summary";
import { DateRangeFilterField } from "./DateRangeFilterField";
import { DemoModeNoticeBanner } from "./DemoModeNoticeBanner";
import { FeedFilterSummaryCard } from "./FeedFilterSummaryCard";
import { HashtagFilterField } from "./HashtagFilterField";

/**
 * Step 1 フィード絞り込みフォームコンポーネントの Props。
 */
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
  /** 折りたたみ状態（指定時は外部制御、省略時は内部制御） */
  isCollapsed?: boolean;
  /** 折りたたみ状態変更ハンドラ */
  onToggleCollapse?: () => void;
  /** 送信ボタンの無効化フラグ（EPUB 生成中など） */
  disabled?: boolean;
  /** デモモードフラグ（変更不可・案内表示） */
  isDemoMode?: boolean;
  /** 直近投稿から集計されたハッシュタグ候補一覧 */
  hashtagSuggestions?: HashtagSuggestion[];
  /** ハッシュタグ候補の読み込み中フラグ */
  isLoadingHashtags?: boolean;
}

/**
 * Step 1: フィード絞り込みフォームおよび折りたたみサマリーを描画するコンポーネント。
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
  hashtagSuggestions = [],
  isLoadingHashtags = false,
}: FeedFilterStepProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const handleDemoBlocked = () => {
    setShowDemoNotice(true);
  };

  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed((prev) => !prev));

  const activePreset = useMemo(
    () => detectPreset(filter.startDate, filter.endDate),
    [filter.startDate, filter.endDate],
  );

  const summaryText = useMemo(
    () => formatFilterSummary({ filter, activePreset, fetchedCount }),
    [filter, activePreset, fetchedCount],
  );

  const handlePresetSelect = (preset: SelectableDatePreset) => {
    const dates = calculatePresetDates(preset);
    onFilterChange({
      ...filter,
      startDate: dates.startDate,
      endDate: dates.endDate,
    });
  };

  if (isCollapsed) {
    return <FeedFilterSummaryCard summaryText={summaryText} onExpand={toggleCollapse} />;
  }

  return (
    <section
      className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 transition-all"
      aria-label="フィード絞り込みフォーム"
    >
      <StepCardHeader
        stepNumber={1}
        title="Step 1: フィードの絞り込み"
        description="ハッシュタグや期間を指定してInstagramから投稿を取得します（最大200件）"
        className="mb-4"
        rightSlot={
          typeof fetchedCount === "number" ? (
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 min-h-[44px] px-2 py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg"
              aria-label="絞り込み条件を折りたたむ"
            >
              <span>閉じる</span>
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : undefined
        }
      />

      {isDemoMode && (
        <DemoModeNoticeBanner
          isBlocked={showDemoNotice}
          onDismiss={() => setShowDemoNotice(false)}
        />
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
        <HashtagFilterField
          hashtag={filter.hashtag}
          onHashtagChange={(nextHashtag) =>
            onFilterChange({
              ...filter,
              hashtag: nextHashtag,
            })
          }
          suggestions={hashtagSuggestions}
          isLoadingSuggestions={isLoadingHashtags}
          isDemoMode={isDemoMode}
          onDemoBlocked={handleDemoBlocked}
        />

        <DateRangeFilterField
          startDate={filter.startDate}
          endDate={filter.endDate}
          activePreset={activePreset}
          onPresetSelect={handlePresetSelect}
          onStartDateChange={(nextStartDate) =>
            onFilterChange({
              ...filter,
              startDate: nextStartDate,
            })
          }
          onEndDateChange={(nextEndDate) =>
            onFilterChange({
              ...filter,
              endDate: nextEndDate,
            })
          }
          isDemoMode={isDemoMode}
          onDemoBlocked={handleDemoBlocked}
        />

        {error && <AlertBanner message={error} />}

        <ActionButton
          type={isDemoMode ? "button" : "submit"}
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={!isDemoMode && disabled}
          onClick={isDemoMode ? handleDemoBlocked : undefined}
          className="min-h-[48px] py-3"
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
        </ActionButton>
      </form>
    </section>
  );
}
