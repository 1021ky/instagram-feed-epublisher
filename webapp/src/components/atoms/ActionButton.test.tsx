import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionButton } from "./ActionButton";

describe("アクションボタン (ActionButton)", () => {
  it.each([
    {
      label: "primary バリアント（デフォルト）",
      props: { children: "投稿を取得" },
      expectedSubstrings: [
        'type="button"',
        "bg-slate-900",
        "min-h-[44px]",
        "focus-visible:ring-2",
        "cursor-pointer",
        "投稿を取得",
      ],
      unexpectedSubstrings: ['disabled=""', "aria-busy=", "w-full", "cursor-not-allowed"],
    },
    {
      label: "gradient バリアント + fullWidth",
      props: {
        children: "Instagramでログイン",
        variant: "gradient" as const,
        fullWidth: true,
      },
      expectedSubstrings: ["from-[#405DE6]", "via-[#C13584]", "to-[#E1306C]", "w-full"],
      unexpectedSubstrings: [],
    },
    {
      label: "secondary バリアント",
      props: {
        children: "キャンセル",
        variant: "secondary" as const,
      },
      expectedSubstrings: ["bg-white", "border-slate-200", "text-slate-700"],
      unexpectedSubstrings: [],
    },
    {
      label: "danger バリアント",
      props: {
        children: "退会を実行する",
        variant: "danger" as const,
      },
      expectedSubstrings: ["bg-rose-600", "hover:bg-rose-700"],
      unexpectedSubstrings: [],
    },
    {
      label: "ローディング中（isLoading=true）",
      props: {
        children: "処理中...",
        isLoading: true,
      },
      expectedSubstrings: ['disabled=""', 'aria-busy="true"', "cursor-not-allowed"],
      unexpectedSubstrings: ["cursor-pointer"],
    },
    {
      label: "無効化状態（disabled=true, type=submit）",
      props: {
        children: "送信",
        disabled: true,
        type: "submit" as const,
      },
      expectedSubstrings: ['type="submit"', 'disabled=""', "cursor-not-allowed"],
      unexpectedSubstrings: ["aria-busy="],
    },
  ])(
    "$label のとき、期待通りのバリアント・属性で描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<ActionButton {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
