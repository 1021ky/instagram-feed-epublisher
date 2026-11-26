import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedFilterOptions } from "@/types/ui";
import { MAX_QUICK_SELECT_CHIPS } from "../model/hashtag";
import { FeedFilterStep } from "./FeedFilterStep";

describe("フィード絞り込みステップ描画 (FeedFilterStep)", () => {
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
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={true}
        fetchedCount={84}
        onToggleCollapse={vi.fn()}
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
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
  });

  it("デモモードのとき注意書きが表示され入力が readOnly になること", () => {
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
    expect(html).not.toContain('disabled=""');
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

  it.each([
    {
      label: "ハッシュタグ集計中かつ候補未取得のとき集計中メッセージを表示する",
      hashtagSuggestions: [],
      isLoadingHashtags: true,
      expectLoadingText: true,
      expectChipGroup: false,
    },
    {
      label: "ハッシュタグ候補が0件かつ非ローディングのときチップ領域を表示しない",
      hashtagSuggestions: [],
      isLoadingHashtags: false,
      expectLoadingText: false,
      expectChipGroup: false,
    },
    {
      label: "既存候補がある状態で再ローディング中になった場合は既存チップを維持する",
      hashtagSuggestions: [
        { tag: "100日チャレンジ", count: 8, lastUsedAt: "2026-09-20T09:00:00.000Z" },
      ],
      isLoadingHashtags: true,
      expectLoadingText: false,
      expectChipGroup: true,
    },
  ])("$label", ({ hashtagSuggestions, isLoadingHashtags, expectLoadingText, expectChipGroup }) => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        hashtagSuggestions={hashtagSuggestions}
        isLoadingHashtags={isLoadingHashtags}
      />,
    );

    if (expectLoadingText) {
      expect(html).toContain("よく使うハッシュタグを集計中...");
    } else {
      expect(html).not.toContain("よく使うハッシュタグを集計中...");
    }

    if (expectChipGroup) {
      expect(html).toContain("よく使うタグから選択:");
    } else {
      expect(html).not.toContain("よく使うタグから選択:");
    }
  });
});
