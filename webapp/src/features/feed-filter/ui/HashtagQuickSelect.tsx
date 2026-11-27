/**
 * @file 集計済みのよく使うハッシュタグ候補をピル型チップ群として描画し、クリックによる絞り込み条件トグルを提供する。
 */
"use client";

import { FilterChip, InlineLoadingStatus } from "@/components/atoms";
import type { HashtagSuggestion } from "@/types/ui";
import {
  MAX_QUICK_SELECT_CHIPS,
  normalizeHashtagForComparison,
  resolveNextHashtagOnChipClick,
} from "../model/hashtag";

/**
 * ハッシュタグクイック選択チップ群コンポーネントの Props。
 */
export interface HashtagQuickSelectProps {
  /** ハッシュタグ候補リスト */
  suggestions: HashtagSuggestion[];
  /** 現在入力・選択されているハッシュタグ文字列 */
  selectedHashtag?: string;
  /** ハッシュタグ候補の集計中フラグ */
  isLoading?: boolean;
  /** デモ体験モードフラグ（操作時に onDemoBlocked を発火） */
  isDemoMode?: boolean;
  /** 表示する最大チップ件数（デフォルト: MAX_QUICK_SELECT_CHIPS） */
  maxChips?: number;
  /** チップクリックによるハッシュタグ変更コールバック */
  onSelectTag: (nextHashtag: string | undefined) => void;
  /** デモモード時の操作ブロック通知コールバック */
  onDemoBlocked?: () => void;
}

/**
 * ハッシュタグ候補の集計ステータスとクイック選択チップ群を描画するコンポーネント。
 */
export function HashtagQuickSelect({
  suggestions,
  selectedHashtag,
  isLoading = false,
  isDemoMode = false,
  maxChips = MAX_QUICK_SELECT_CHIPS,
  onSelectTag,
  onDemoBlocked,
}: HashtagQuickSelectProps) {
  if (isLoading && suggestions.length === 0) {
    return <InlineLoadingStatus message="よく使うハッシュタグを集計中..." />;
  }

  if (suggestions.length === 0) {
    return null;
  }

  const normalizedCurrent = normalizeHashtagForComparison(selectedHashtag);

  return (
    <div className="pt-1.5 space-y-1.5">
      <span className="text-[11px] font-medium text-slate-500 block">よく使うタグから選択:</span>
      <div role="group" aria-label="よく使うハッシュタグ" className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, maxChips).map((item) => {
          const isSelected =
            Boolean(normalizedCurrent) &&
            normalizedCurrent === item.tag.normalize("NFC").toLowerCase();

          return (
            <FilterChip
              key={item.tag}
              label={`#${item.tag}`}
              count={item.count}
              selected={isSelected}
              readOnly={isDemoMode}
              onClick={() => {
                if (isDemoMode) {
                  onDemoBlocked?.();
                  return;
                }
                onSelectTag(resolveNextHashtagOnChipClick(selectedHashtag, item.tag));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
