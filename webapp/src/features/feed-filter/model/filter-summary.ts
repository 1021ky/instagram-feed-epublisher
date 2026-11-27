/**
 * @file 折りたたまれた Step 1 絞り込み条件カードに表示する 1 行サマリー文字列を生成する。
 */
import type { DatePreset, FeedFilterOptions } from "@/types/ui";
import { stripLeadingHash } from "./hashtag";

/**
 * 折りたたみサマリー文言の生成に必要な入力値。
 */
export interface FilterSummaryInput {
  /** 現在の絞り込み条件 */
  filter: FeedFilterOptions;
  /** 判定済みの期間プリセット種別 */
  activePreset: DatePreset;
  /** 取得済みの投稿件数（未取得時は undefined） */
  fetchedCount?: number;
}

/**
 * 絞り込み条件を折りたたみヘッダー用の 1 行サマリー文字列へ整形する。
 */
export function formatFilterSummary({
  filter,
  activePreset,
  fetchedCount,
}: FilterSummaryInput): string {
  const tagLabel = filter.hashtag ? `#${stripLeadingHash(filter.hashtag)}` : "すべてのタグ";

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
}
