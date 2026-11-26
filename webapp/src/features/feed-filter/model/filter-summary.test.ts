import { describe, expect, it } from "vitest";
import type { DatePreset, FeedFilterOptions } from "@/types/ui";
import { formatFilterSummary } from "./filter-summary";

describe("絞り込み条件サマリー整形 (formatFilterSummary)", () => {
  it.each<{
    label: string;
    filter: FeedFilterOptions;
    activePreset: DatePreset;
    fetchedCount?: number;
    expected: string;
  }>([
    {
      label: "タグあり・直近100日・取得済み件数あり",
      filter: {
        hashtag: "100日チャレンジ",
        startDate: "2026-06-13",
        endDate: "2026-09-21",
        maxCount: 200,
      },
      activePreset: "100days",
      fetchedCount: 84,
      expected: "#100日チャレンジ / 直近100日 / 84件取得中",
    },
    {
      label: "先頭 # 付きタグ・直近30日・未取得",
      filter: {
        hashtag: "#京都カフェ",
        startDate: "2026-08-22",
        endDate: "2026-09-21",
        maxCount: 200,
      },
      activePreset: "30days",
      expected: "#京都カフェ / 直近30日 / 最大200件",
    },
    {
      label: "タグ未指定・全期間・取得件数0件",
      filter: {
        hashtag: "",
        maxCount: 200,
      },
      activePreset: "all",
      fetchedCount: 0,
      expected: "すべてのタグ / 全期間 / 0件取得中",
    },
    {
      label: "カスタム期間（開始日・終了日両方あり）",
      filter: {
        hashtag: "朝活",
        startDate: "2026-01-01",
        endDate: "2026-05-01",
        maxCount: 100,
      },
      activePreset: "custom",
      expected: "#朝活 / 2026-01-01 〜 2026-05-01 / 最大100件",
    },
    {
      label: "カスタム期間（開始日のみ指定）",
      filter: {
        startDate: "2026-01-01",
        maxCount: 200,
      },
      activePreset: "custom",
      expected: "すべてのタグ / 2026-01-01 〜 今日 / 最大200件",
    },
    {
      label: "カスタム期間（終了日のみ指定）",
      filter: {
        endDate: "2026-05-01",
        maxCount: 200,
      },
      activePreset: "custom",
      expected: "すべてのタグ / 開始 〜 2026-05-01 / 最大200件",
    },
  ])(
    "$label のとき期待通りのサマリー文字列を返すこと",
    ({ filter, activePreset, fetchedCount, expected }) => {
      expect(formatFilterSummary({ filter, activePreset, fetchedCount })).toBe(expected);
    },
  );
});
