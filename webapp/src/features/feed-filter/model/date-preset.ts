import type { DatePreset, EpubSortOrder, FeedFilterOptions } from "@/types/ui";
import { stripLeadingHash } from "./hashtag";

/** フィード絞り込みのデフォルト最大取得件数。 */
export const DEFAULT_FEED_MAX_COUNT = 200;

/**
 * 開始日・終了日の日付範囲（YYYY-MM-DD 形式）。
 */
export interface DateRange {
  /** 開始日（YYYY-MM-DD 形式） */
  startDate?: string;
  /** 終了日（YYYY-MM-DD 形式） */
  endDate?: string;
}

/**
 * プリセット切替 UI で直接選択可能な期間種別。
 */
export type SelectableDatePreset = Exclude<DatePreset, "custom">;

/**
 * 期間プリセット選択肢の定義。
 */
export interface DatePresetOption {
  /** プリセット識別子 */
  value: SelectableDatePreset;
  /** ボタン表示ラベル */
  label: string;
}

/** 期間指定 UI に表示するプリセット選択肢一覧。 */
export const DATE_PRESET_OPTIONS: readonly DatePresetOption[] = [
  { value: "100days", label: "直近100日" },
  { value: "30days", label: "直近30日" },
  { value: "all", label: "全期間" },
];

/**
 * API リクエストおよびクライアント絞り込みに渡す正規化済みフィルター条件。
 */
export interface NormalizedFeedFetchFilter {
  /** 先頭記号を除去したハッシュタグ（未指定時は undefined） */
  hashtag?: string;
  /** 開始日（YYYY-MM-DD 形式） */
  startDate?: string;
  /** 終了日（YYYY-MM-DD 形式） */
  endDate?: string;
  /** 最大取得件数 */
  maxCount: number;
  /** 投稿の並び順 */
  sortOrder: EpubSortOrder;
}

/**
 * 日付をローカルタイムゾーン基準の YYYY-MM-DD 形式に変換する。
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 期間プリセットに対応する開始日・終了日を算出する。
 */
export function calculatePresetDates(preset: DatePreset, baseDate: Date = new Date()): DateRange {
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
 * 現在の開始日・終了日から該当する期間プリセット種別を判定する。
 */
export function detectPreset(
  startDate?: string,
  endDate?: string,
  baseDate: Date = new Date(),
): DatePreset {
  if (!startDate && !endDate) {
    return "all";
  }

  const preset100 = calculatePresetDates("100days", baseDate);
  if (startDate === preset100.startDate && endDate === preset100.endDate) {
    return "100days";
  }

  const preset30 = calculatePresetDates("30days", baseDate);
  if (startDate === preset30.startDate && endDate === preset30.endDate) {
    return "30days";
  }

  return "custom";
}

/**
 * 初期表示用のフィード絞り込み条件（直近30日・最大200件）を生成する。
 */
export function createInitialFeedFilter(baseDate: Date = new Date()): FeedFilterOptions {
  const range = calculatePresetDates("30days", baseDate);
  return {
    hashtag: "",
    startDate: range.startDate,
    endDate: range.endDate,
    maxCount: DEFAULT_FEED_MAX_COUNT,
  };
}

/**
 * フォームの絞り込み条件と並び順から API / フィルタ処理向けの正規化済み条件を生成する。
 */
export function toFeedFetchFilter(
  filter: FeedFilterOptions,
  sortOrder: EpubSortOrder,
): NormalizedFeedFetchFilter {
  const cleanedHashtag = filter.hashtag ? stripLeadingHash(filter.hashtag.trim()).trim() : "";
  return {
    hashtag: cleanedHashtag || undefined,
    startDate: filter.startDate,
    endDate: filter.endDate,
    maxCount: filter.maxCount,
    sortOrder,
  };
}
