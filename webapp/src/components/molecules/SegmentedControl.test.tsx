import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const SORT_OPTIONS = [
  { value: "asc", label: "古い順（おすすめ）" },
  { value: "desc", label: "新しい順" },
] as const;

describe("セグメント切替コントロール (SegmentedControl)", () => {
  it.each([
    {
      label: "先頭オプションが選択状態",
      props: {
        ariaLabel: "投稿の並び順",
        options: SORT_OPTIONS,
        value: "asc" as const,
        onChange: vi.fn(),
      },
      expectedSubstrings: [
        'role="group"',
        'aria-label="投稿の並び順"',
        'aria-pressed="true"',
        'aria-pressed="false"',
        "min-h-[44px]",
        "focus-visible:ring-2",
        "cursor-pointer",
      ],
      unexpectedSubstrings: ['disabled=""', "cursor-not-allowed"],
    },
    {
      label: "どのオプションにも一致しない状態（custom 等）",
      props: {
        ariaLabel: "投稿の並び順",
        options: SORT_OPTIONS,
        value: null,
        onChange: vi.fn(),
      },
      expectedSubstrings: ['aria-pressed="false"'],
      unexpectedSubstrings: ['aria-pressed="true"'],
    },
    {
      label: "読み取り専用状態（readOnly=true では disabled 属性を付けない）",
      props: {
        ariaLabel: "投稿の並び順",
        options: SORT_OPTIONS,
        value: "asc" as const,
        readOnly: true,
        onChange: vi.fn(),
      },
      expectedSubstrings: ["cursor-not-allowed"],
      unexpectedSubstrings: ["cursor-pointer", 'disabled=""'],
    },
    {
      label: "無効化状態（disabled=true）",
      props: {
        ariaLabel: "投稿の並び順",
        options: SORT_OPTIONS,
        value: "asc" as const,
        disabled: true,
        onChange: vi.fn(),
      },
      expectedSubstrings: ['disabled=""', "cursor-not-allowed"],
      unexpectedSubstrings: ["cursor-pointer"],
    },
  ])(
    "$label のとき、期待通りの ARIA 属性と状態で描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<SegmentedControl {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
