import { describe, expect, it } from "vitest";
import {
  MAX_QUICK_SELECT_CHIPS,
  normalizeHashtagForComparison,
  resolveNextHashtagOnChipClick,
  stripLeadingHash,
} from "./hashtag";

describe("ハッシュタグ入力正規化とチップ選択ロジック (hashtag)", () => {
  it("クイック選択チップの最大表示件数が 10 件であること", () => {
    expect(MAX_QUICK_SELECT_CHIPS).toBe(10);
  });

  it.each([
    { label: "半角 # を除去", raw: "#京都カフェ", expected: "京都カフェ" },
    { label: "全角 ＃ を除去", raw: "＃朝活", expected: "朝活" },
    { label: "記号なしはそのまま", raw: "旅行記録", expected: "旅行記録" },
    { label: "空文字はそのまま", raw: "", expected: "" },
  ])("stripLeadingHash: $label", ({ raw, expected }) => {
    expect(stripLeadingHash(raw)).toBe(expected);
  });

  it.each([
    { label: "未定義", raw: undefined, expected: "" },
    { label: "大文字・先頭記号・空白を正規化", raw: " #Travel ", expected: "travel" },
    { label: "全角記号と NFD を NFC へ正規化", raw: "＃ふ\u309Aりん", expected: "ぷりん" },
  ])("normalizeHashtagForComparison: $label", ({ raw, expected }) => {
    expect(normalizeHashtagForComparison(raw)).toBe(expected);
  });

  it.each([
    {
      label: "未選択から新規タグを選択",
      current: undefined,
      clicked: "京都カフェ",
      expected: "京都カフェ",
    },
    {
      label: "別タグから切り替え",
      current: "朝活",
      clicked: "#京都カフェ",
      expected: "京都カフェ",
    },
    {
      label: "同一タグ再クリックで解除",
      current: "京都カフェ",
      clicked: "京都カフェ",
      expected: undefined,
    },
    {
      label: "大文字小文字の違いを無視して同一タグ解除",
      current: "Travel",
      clicked: "travel",
      expected: undefined,
    },
    {
      label: "全角・NFD/NFCゆれを正規化して同一タグ解除",
      current: "＃ふ\u309Aりん",
      clicked: "ぷりん",
      expected: undefined,
    },
    { label: "空文字クリックで解除", current: "朝活", clicked: "", expected: undefined },
    { label: "空白のみクリックで解除", current: "朝活", clicked: "#   ", expected: undefined },
    { label: "全角＃のみクリックで解除", current: "朝活", clicked: "＃", expected: undefined },
  ])("resolveNextHashtagOnChipClick: $label", ({ current, clicked, expected }) => {
    expect(resolveNextHashtagOnChipClick(current, clicked)).toBe(expected);
  });
});
