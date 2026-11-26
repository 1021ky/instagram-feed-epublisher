import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MAX_QUICK_SELECT_CHIPS } from "../model/hashtag";
import { HashtagQuickSelect } from "./HashtagQuickSelect";

describe("ハッシュタグクイック選択 (HashtagQuickSelect)", () => {
  it.each([
    {
      label: "候補0件かつ非ローディングのときは何も描画しない（空文字）",
      props: {
        suggestions: [],
        isLoading: false,
        onSelectTag: vi.fn(),
      },
      expectedSubstrings: [],
      unexpectedSubstrings: ["よく使うタグから選択:", "よく使うハッシュタグを集計中..."],
      expectEmptyHtml: true,
    },
    {
      label: "候補0件かつローディング中のときは集計中ステータスを表示する",
      props: {
        suggestions: [],
        isLoading: true,
        onSelectTag: vi.fn(),
      },
      expectedSubstrings: ['role="status"', "よく使うハッシュタグを集計中..."],
      unexpectedSubstrings: ["よく使うタグから選択:"],
      expectEmptyHtml: false,
    },
    {
      label: "候補が存在する場合はローディング中でも既存チップ群を優先表示する",
      props: {
        suggestions: [{ tag: "100日チャレンジ", count: 8, lastUsedAt: "2026-09-20T09:00:00.000Z" }],
        selectedHashtag: "100日チャレンジ",
        isLoading: true,
        onSelectTag: vi.fn(),
      },
      expectedSubstrings: [
        'role="group"',
        'aria-label="よく使うハッシュタグ"',
        "#100日チャレンジ",
        "(8)",
        'aria-pressed="true"',
      ],
      unexpectedSubstrings: ["よく使うハッシュタグを集計中..."],
      expectEmptyHtml: false,
    },
  ])("$label", ({ props, expectedSubstrings, unexpectedSubstrings, expectEmptyHtml }) => {
    const html = renderToStaticMarkup(<HashtagQuickSelect {...props} />);

    if (expectEmptyHtml) {
      expect(html).toBe("");
    }
    for (const expected of expectedSubstrings) {
      expect(html).toContain(expected);
    }
    for (const unexpected of unexpectedSubstrings) {
      expect(html).not.toContain(unexpected);
    }
  });

  it("候補が MAX_QUICK_SELECT_CHIPS (10件) を超える場合、上位10件のみチップ描画されること", () => {
    const manySuggestions = Array.from({ length: 15 }, (_, idx) => ({
      tag: `タグ${idx + 1}`,
      count: 20 - idx,
      lastUsedAt: "2026-09-20T09:00:00.000Z",
    }));

    const html = renderToStaticMarkup(
      <HashtagQuickSelect
        suggestions={manySuggestions}
        selectedHashtag="タグ1"
        onSelectTag={vi.fn()}
      />,
    );

    expect(MAX_QUICK_SELECT_CHIPS).toBe(10);
    expect(html).toContain("<span>#タグ1</span>");
    expect(html).toContain("<span>#タグ10</span>");
    expect(html).not.toContain("<span>#タグ11</span>");
  });
});
