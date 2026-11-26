import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IconButton } from "./IconButton";

describe("アイコンボタン (IconButton)", () => {
  it.each([
    {
      label: "デフォルト（neutral / rounded）",
      props: {
        "aria-label": "閉じる",
        icon: <span aria-hidden="true">×</span>,
      },
      expectedSubstrings: [
        'type="button"',
        'aria-label="閉じる"',
        "min-h-[44px]",
        "min-w-[44px]",
        "focus-visible:ring-2",
        "rounded-lg",
        "text-slate-500",
        "cursor-pointer",
      ],
      unexpectedSubstrings: ['disabled=""', "cursor-not-allowed", "rounded-full"],
    },
    {
      label: "sky バリアント・余白クラス指定",
      props: {
        "aria-label": "通知を閉じる",
        icon: <span aria-hidden="true">×</span>,
        variant: "sky" as const,
        className: "-mr-1.5",
      },
      expectedSubstrings: [
        'aria-label="通知を閉じる"',
        "text-sky-700",
        "hover:bg-sky-100",
        "-mr-1.5",
      ],
      unexpectedSubstrings: ['disabled=""'],
    },
    {
      label: "amber バリアント・円形（circle）",
      props: {
        "aria-label": "警告を閉じる",
        icon: <span aria-hidden="true">×</span>,
        variant: "amber" as const,
        shape: "circle" as const,
      },
      expectedSubstrings: ["text-amber-700", "rounded-full"],
      unexpectedSubstrings: ["rounded-lg"],
    },
    {
      label: "emerald バリアント",
      props: {
        "aria-label": "完了通知を閉じる",
        icon: <span aria-hidden="true">×</span>,
        variant: "emerald" as const,
      },
      expectedSubstrings: ["text-emerald-700", "hover:bg-emerald-100"],
      unexpectedSubstrings: [],
    },
    {
      label: "無効化状態（disabled=true）",
      props: {
        "aria-label": "モーダルを閉じる",
        icon: <span aria-hidden="true">×</span>,
        disabled: true,
      },
      expectedSubstrings: ['disabled=""', "cursor-not-allowed", "disabled:opacity-50"],
      unexpectedSubstrings: ["cursor-pointer"],
    },
  ])(
    "$label のとき、期待通りの属性とスタイルで描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<IconButton {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
