"use client";

import { useId } from "react";
import { Calendar } from "lucide-react";
import { SegmentedControl } from "@/components/molecules";
import type { DatePreset } from "@/types/ui";
import { DATE_PRESET_OPTIONS, type SelectableDatePreset } from "../model/date-preset";

/**
 * 期間プリセットおよび開始日・終了日入力セクションの Props。
 */
export interface DateRangeFilterFieldProps {
  /** 開始日（YYYY-MM-DD 形式） */
  startDate?: string;
  /** 終了日（YYYY-MM-DD 形式） */
  endDate?: string;
  /** 現在一致している期間プリセット種別 */
  activePreset: DatePreset;
  /** プリセット選択時のコールバック */
  onPresetSelect: (preset: SelectableDatePreset) => void;
  /** 開始日変更時のコールバック */
  onStartDateChange: (nextStartDate: string | undefined) => void;
  /** 終了日変更時のコールバック */
  onEndDateChange: (nextEndDate: string | undefined) => void;
  /** デモ体験モードフラグ（readOnly 制御・操作ブロック通知） */
  isDemoMode: boolean;
  /** デモモード時の操作ブロック通知コールバック */
  onDemoBlocked: () => void;
}

/**
 * 期間プリセット切替と開始日・終了日の日付入力欄をまとめたフィールドコンポーネント。
 */
export function DateRangeFilterField({
  startDate,
  endDate,
  activePreset,
  onPresetSelect,
  onStartDateChange,
  onEndDateChange,
  isDemoMode,
  onDemoBlocked,
}: DateRangeFilterFieldProps) {
  const startDateId = useId();
  const endDateId = useId();

  const dateInputClassName = `w-full px-3 py-2 text-sm rounded-xl outline-none transition min-h-[44px] ${
    isDemoMode
      ? "bg-slate-100/70 border border-slate-200 text-slate-600 cursor-not-allowed"
      : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
  }`;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span>期間指定</span>
        </span>

        <SegmentedControl<SelectableDatePreset>
          ariaLabel="期間プリセット"
          options={DATE_PRESET_OPTIONS}
          value={activePreset === "custom" ? null : activePreset}
          onChange={onPresetSelect}
          readOnly={isDemoMode}
          onReadOnlyClick={onDemoBlocked}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={startDateId} className="text-xs font-medium text-slate-500">
            開始日
          </label>
          <input
            id={startDateId}
            type="date"
            value={startDate ?? ""}
            readOnly={isDemoMode}
            onClick={isDemoMode ? onDemoBlocked : undefined}
            onFocus={isDemoMode ? onDemoBlocked : undefined}
            onKeyDown={
              isDemoMode
                ? (e) => {
                    e.preventDefault();
                    onDemoBlocked();
                  }
                : undefined
            }
            onChange={(e) => {
              if (isDemoMode) {
                onDemoBlocked();
                return;
              }
              onStartDateChange(e.target.value || undefined);
            }}
            className={dateInputClassName}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={endDateId} className="text-xs font-medium text-slate-500">
            終了日
          </label>
          <input
            id={endDateId}
            type="date"
            value={endDate ?? ""}
            readOnly={isDemoMode}
            onClick={isDemoMode ? onDemoBlocked : undefined}
            onFocus={isDemoMode ? onDemoBlocked : undefined}
            onKeyDown={
              isDemoMode
                ? (e) => {
                    e.preventDefault();
                    onDemoBlocked();
                  }
                : undefined
            }
            onChange={(e) => {
              if (isDemoMode) {
                onDemoBlocked();
                return;
              }
              onEndDateChange(e.target.value || undefined);
            }}
            className={dateInputClassName}
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-400 m-0">
        ※ 1回の取得で最大200件の投稿を自動取得します。
      </p>
    </div>
  );
}
