import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedFilterOptions } from "@/types/ui";
import {
  calculatePresetDates,
  detectPreset,
  FeedFilterStep,
  formatDateToISO,
  MAX_QUICK_SELECT_CHIPS,
  resolveNextHashtagOnChipClick,
} from "./FeedFilterStep";

describe("FeedFilterStep ロジックおよび日付プリセット", () => {
  const baseDate = new Date("2026-09-21T00:00:00Z");

  it("formatDateToISO が YYYY-MM-DD 形式で正しく出力すること", () => {
    expect(formatDateToISO(baseDate)).toBe("2026-09-21");
  });

  it.each([
    { preset: "100days" as const, expectedStart: "2026-06-13", expectedEnd: "2026-09-21" },
    { preset: "30days" as const, expectedStart: "2026-08-22", expectedEnd: "2026-09-21" },
    { preset: "all" as const, expectedStart: undefined, expectedEnd: undefined },
  ])(
    "calculatePresetDates: プリセット '$preset' で正しい期間を算出すること",
    ({ preset, expectedStart, expectedEnd }) => {
      const dates = calculatePresetDates(preset, baseDate);
      expect(dates.startDate).toBe(expectedStart);
      expect(dates.endDate).toBe(expectedEnd);
    },
  );

  it.each([
    { label: "全期間 (未指定)", start: undefined, end: undefined, expected: "all" },
    { label: "直近100日", start: "2026-06-13", end: "2026-09-21", expected: "100days" },
    { label: "直近30日", start: "2026-08-22", end: "2026-09-21", expected: "30days" },
    { label: "カスタム期間", start: "2026-01-01", end: "2026-05-01", expected: "custom" },
  ])("detectPreset: $label の設定値から '$expected' を判定すること", ({ start, end, expected }) => {
    expect(detectPreset(start, end, baseDate)).toBe(expected);
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

describe("FeedFilterStep コンポーネント描画", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultFilter: FeedFilterOptions = {
    hashtag: "100日チャレンジ",
    startDate: "2026-06-13",
    endDate: "2026-09-21",
    maxCount: 200,
  };

  it("展開状態（デフォルト）で入力項目、期間プリセット、取得ボタンが描画されること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
      />,
    );

    expect(html).toContain("Step 1: フィードの絞り込み");
    expect(html).toContain("100日チャレンジ");
    expect(html).toContain("直近100日");
    expect(html).toContain("直近30日");
    expect(html).toContain("全期間");
    expect(html).toContain("最大200件");
    expect(html).toContain("この条件で投稿を取得");
    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("min-h-[48px]");
  });

  it("折りたたみ状態（isCollapsed=true）でコンパクトなサマリーが表示されること", () => {
    const onToggle = vi.fn();
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={true}
        fetchedCount={84}
        onToggleCollapse={onToggle}
      />,
    );

    expect(html).toContain("絞り込み条件");
    expect(html).toContain("#100日チャレンジ");
    expect(html).toContain("直近100日");
    expect(html).toContain("84件取得中");
    expect(html).toContain("条件を変更");
    expect(html).not.toContain("この条件で投稿を取得");
  });

  it("ローディング中のときボタンが無効化されスピナーテキストが表示されること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        isLoading={true}
      />,
    );

    expect(html).toContain("投稿を取得中...");
    expect(html).toContain("disabled");
  });

  it("デモモードのとき注意書きが表示され入力が無効化されること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        isDemoMode={true}
      />,
    );

    expect(html).toContain(
      "デモ体験モード：条件は固定サンプルです（ログイン後に自由に変更できます）",
    );
    expect(html).toMatch(/readonly/i);
    expect(html).toContain("cursor-not-allowed");
    expect(html).toContain("この条件で投稿を取得");
  });

  it("ハッシュタグ候補があるとき、<datalist> オプションとクイック選択チップ（最大10件・選択状態 aria-pressed）が描画されること", () => {
    const manySuggestions = Array.from({ length: 15 }, (_, idx) => ({
      tag: idx === 0 ? "100日チャレンジ" : `タグ${idx + 1}`,
      count: 20 - idx,
      lastUsedAt: "2026-09-20T09:00:00.000Z",
    }));

    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        hashtagSuggestions={manySuggestions}
      />,
    );

    expect(html).toContain('list="hashtag-suggestions"');
    expect(html).toContain('<datalist id="hashtag-suggestions">');
    expect(html).toContain('value="タグ15"');
    expect(html).toContain('aria-label="よく使うハッシュタグ"');
    expect(html).toContain("#100日チャレンジ");
    expect(html).toContain("(20)");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("#タグ10");
    expect(html).not.toContain("><span>#タグ11</span>");
    expect(MAX_QUICK_SELECT_CHIPS).toBe(10);
  });

  it("ハッシュタグ集計中（isLoadingHashtags=true かつ候補未取得）のときローディングステータスメッセージが表示されること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        hashtagSuggestions={[]}
        isLoadingHashtags={true}
      />,
    );

    expect(html).toContain("よく使うハッシュタグを集計中...");
  });

  it("ハッシュタグ候補が 0 件かつ非ローディングのとき、クイック選択チップ領域が表示されないこと", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        hashtagSuggestions={[]}
        isLoadingHashtags={false}
      />,
    );

    expect(html).not.toContain("よく使うタグから選択:");
    expect(html).not.toContain("よく使うハッシュタグを集計中...");
  });

  it("すでにハッシュタグ候補が存在する状態で isLoadingHashtags=true になった場合、既存チップを表示し続け重複ローディング文言を出さないこと", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        hashtagSuggestions={[
          { tag: "100日チャレンジ", count: 8, lastUsedAt: "2026-09-20T09:00:00.000Z" },
        ]}
        isLoadingHashtags={true}
      />,
    );

    expect(html).toContain("#100日チャレンジ");
    expect(html).not.toContain("よく使うハッシュタグを集計中...");
  });
});
