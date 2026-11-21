/**
 * @file ハッシュタグ候補クイック選択コンポーネント (Molecule)
 * 集計中のインラインローディング表示（InlineLoadingStatus）と、
 * よく使うハッシュタグのピル型チップ群（FilterChip）を組み合わせて提供します。
 */
"use client";

import { FilterChip, InlineLoadingStatus } from "@/components/atoms";
import type { HashtagSuggestion } from "@/types/ui";

/** クイック選択チップとして画面上に並べる最大件数 */
export const MAX_QUICK_SELECT_CHIPS = 10;

/**
 * ハッシュタグのクイック選択チップがクリックされた際の次の入力値（選択または解除）を算出します。
 */
export function resolveNextHashtagOnChipClick(
  currentHashtag: string | undefined,
  clickedTag: string,
): string | undefined {
  const cleanClicked = clickedTag.replace(/^[#＃]/, "").trim();
  if (!cleanClicked) {
    return undefined;
  }
  const normalizedCurrent = (currentHashtag ?? "")
    .replace(/^[#＃]/, "")
    .trim()
    .normalize("NFC")
    .toLowerCase();
  const normalizedClicked = cleanClicked.normalize("NFC").toLowerCase();

  if (normalizedCurrent && normalizedCurrent === normalizedClicked) {
    return undefined;
  }
  return cleanClicked;
}

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

  const normalizedCurrent = (selectedHashtag ?? "")
    .replace(/^[#＃]/, "")
    .trim()
    .normalize("NFC")
    .toLowerCase();

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
