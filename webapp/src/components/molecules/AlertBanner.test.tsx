import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlertBanner } from "./AlertBanner";

describe("エラーアラートバナー (AlertBanner)", () => {
  it.each([
    {
      label: "標準エラーメッセージ表示",
      props: { message: "フィード取得に失敗しました" },
      expectedSubstrings: [
        'role="alert"',
        '<span class="font-bold">✕</span>',
        "フィード取得に失敗しました",
        "bg-rose-50",
      ],
    },
    {
      label: "追加クラス（mb-4）指定時のマージン適用",
      props: { message: "先にログインしてください", className: "mb-4" },
      expectedSubstrings: ['role="alert"', "先にログインしてください", "mb-4"],
    },
  ])("$label で期待通りのアラートバナーが描画されること", ({ props, expectedSubstrings }) => {
    const html = renderToStaticMarkup(<AlertBanner {...props} />);

    for (const expected of expectedSubstrings) {
      expect(html).toContain(expected);
    }
  });
});
