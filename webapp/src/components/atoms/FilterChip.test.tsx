import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilterChip } from "./FilterChip";

describe("フィルターチップ (FilterChip)", () => {
  it.each([
    {
      label: "未選択かつ件数ありの標準表示",
      props: { label: "#京都カフェ", count: 12, selected: false },
      expectedSubstrings: [
        'aria-pressed="false"',
        "<span>#京都カフェ</span>",
        "(12)",
        "bg-slate-100",
        "text-slate-500",
        "cursor-pointer",
        "min-h-[44px]",
      ],
      unexpectedSubstrings: ['aria-pressed="true"', "cursor-not-allowed", 'disabled=""'],
    },
    {
      label: "選択状態（selected=true）のアクティブ表示",
      props: { label: "#100日チャレンジ", count: 20, selected: true },
      expectedSubstrings: [
        'aria-pressed="true"',
        "<span>#100日チャレンジ</span>",
        "(20)",
        "bg-slate-900 text-white",
        "text-slate-300",
      ],
      unexpectedSubstrings: ['aria-pressed="false"'],
    },
    {
      label: "件数カウント未指定（count=undefined）のラベル単体表示",
      props: { label: "#朝活", selected: false },
      expectedSubstrings: ["<span>#朝活</span>", 'aria-pressed="false"'],
      unexpectedSubstrings: ["(", ")"],
    },
    {
      label: "件数カウントが 0 件の境界値表示",
      props: { label: "#テスト", count: 0, selected: false },
      expectedSubstrings: ["<span>#テスト</span>", "(0)"],
      unexpectedSubstrings: [],
    },
    {
      label: "読み取り専用（readOnly=true）のカーソル非活性表示",
      props: { label: "#デモ", count: 5, readOnly: true },
      expectedSubstrings: ["cursor-not-allowed"],
      unexpectedSubstrings: ["cursor-pointer", "disabled="],
    },
    {
      label: "無効化状態（disabled=true）の属性・カーソル反映",
      props: { label: "#無効", count: 1, disabled: true },
      expectedSubstrings: ['disabled=""', "cursor-not-allowed"],
      unexpectedSubstrings: ["cursor-pointer"],
    },
  ])(
    "$label で期待通りのマークアップが描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<FilterChip {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
