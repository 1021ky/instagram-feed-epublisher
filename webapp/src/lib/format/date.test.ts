/**
 * @file 日時フォーマットユーティリティの単体テスト
 */
import { describe, expect, it } from "vitest";
import { formatDateTimeJP } from "./date";

describe("日時フォーマット処理 (formatDateTimeJP)", () => {
  it.each([
    {
      label: "有効な ISO 8601 日時文字列",
      input: "2026-09-20T10:30:00Z",
      matchesPattern: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,
    },
    {
      label: "不正な日時文字列（フォールバック）",
      input: "invalid-date",
      expectedExact: "invalid-date",
    },
    {
      label: "空文字列（フォールバック）",
      input: "",
      expectedExact: "",
    },
  ])("$label を期待通りに整形すること", ({ input, matchesPattern, expectedExact }) => {
    const formatted = formatDateTimeJP(input);
    if (matchesPattern) {
      expect(formatted).toMatch(matchesPattern);
    }
    if (expectedExact !== undefined) {
      expect(formatted).toBe(expectedExact);
    }
  });
});
