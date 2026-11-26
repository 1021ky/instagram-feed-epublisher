import { describe, expect, it } from "vitest";
import {
  calculatePresetDates,
  createInitialFeedFilter,
  DEFAULT_FEED_MAX_COUNT,
  detectPreset,
  formatDateToISO,
  toFeedFetchFilter,
} from "./date-preset";

describe("期間プリセットと絞り込み条件変換 (date-preset)", () => {
  const baseDate = new Date("2026-09-21T00:00:00Z");

  it("formatDateToISO が YYYY-MM-DD 形式で出力すること", () => {
    expect(formatDateToISO(baseDate)).toBe("2026-09-21");
  });

  it.each([
    {
      label: "直近100日",
      preset: "100days" as const,
      expectedStart: "2026-06-13",
      expectedEnd: "2026-09-21",
    },
    {
      label: "直近30日",
      preset: "30days" as const,
      expectedStart: "2026-08-22",
      expectedEnd: "2026-09-21",
    },
    {
      label: "全期間",
      preset: "all" as const,
      expectedStart: undefined,
      expectedEnd: undefined,
    },
    {
      label: "カスタム期間",
      preset: "custom" as const,
      expectedStart: undefined,
      expectedEnd: undefined,
    },
  ])(
    "calculatePresetDates が $label の期間を正しく算出すること",
    ({ preset, expectedStart, expectedEnd }) => {
      const dates = calculatePresetDates(preset, baseDate);
      expect(dates.startDate).toBe(expectedStart);
      expect(dates.endDate).toBe(expectedEnd);
    },
  );

  it.each([
    { label: "全期間（未指定）", start: undefined, end: undefined, expected: "all" },
    { label: "直近100日", start: "2026-06-13", end: "2026-09-21", expected: "100days" },
    { label: "直近30日", start: "2026-08-22", end: "2026-09-21", expected: "30days" },
    { label: "カスタム期間", start: "2026-01-01", end: "2026-05-01", expected: "custom" },
    { label: "開始日のみ指定", start: "2026-08-22", end: undefined, expected: "custom" },
  ])(
    "detectPreset が $label の設定値から '$expected' を判定すること",
    ({ start, end, expected }) => {
      expect(detectPreset(start, end, baseDate)).toBe(expected);
    },
  );

  it("createInitialFeedFilter が直近30日・最大200件の初期フィルターを生成すること", () => {
    expect(createInitialFeedFilter(baseDate)).toEqual({
      hashtag: "",
      startDate: "2026-08-22",
      endDate: "2026-09-21",
      maxCount: DEFAULT_FEED_MAX_COUNT,
    });
  });

  it.each([
    {
      label: "半角 # 付きハッシュタグ",
      hashtag: "#京都カフェ",
      sortOrder: "asc" as const,
      expectedHashtag: "京都カフェ",
    },
    {
      label: "全角 ＃ 付きハッシュタグ",
      hashtag: "＃朝活",
      sortOrder: "desc" as const,
      expectedHashtag: "朝活",
    },
    {
      label: "空文字",
      hashtag: "",
      sortOrder: "asc" as const,
      expectedHashtag: undefined,
    },
    {
      label: "記号と空白のみ",
      hashtag: "#   ",
      sortOrder: "asc" as const,
      expectedHashtag: undefined,
    },
  ])(
    "toFeedFetchFilter が $label を正しく正規化すること",
    ({ hashtag, sortOrder, expectedHashtag }) => {
      expect(
        toFeedFetchFilter(
          {
            hashtag,
            startDate: "2026-08-22",
            endDate: "2026-09-21",
            maxCount: 200,
          },
          sortOrder,
        ),
      ).toEqual({
        hashtag: expectedHashtag,
        startDate: "2026-08-22",
        endDate: "2026-09-21",
        maxCount: 200,
        sortOrder,
      });
    },
  );
});
