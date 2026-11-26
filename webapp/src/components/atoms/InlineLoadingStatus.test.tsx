import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InlineLoadingStatus } from "./InlineLoadingStatus";

describe("インラインローディングステータス (InlineLoadingStatus)", () => {
  it.each([
    {
      label: "デフォルトクラスでのステータスメッセージ表示",
      props: { message: "よく使うハッシュタグを集計中..." },
      expectedSubstrings: [
        'role="status"',
        'aria-live="polite"',
        "animate-spin",
        "よく使うハッシュタグを集計中...",
        "pt-1",
      ],
    },
    {
      label: "カスタム className 指定時の反映",
      props: { message: "データを読み込み中...", className: "mt-2" },
      expectedSubstrings: ['role="status"', "データを読み込み中...", "mt-2"],
    },
  ])("$label でアクセシブルなローディング表示が描画されること", ({ props, expectedSubstrings }) => {
    const html = renderToStaticMarkup(<InlineLoadingStatus {...props} />);

    for (const expected of expectedSubstrings) {
      expect(html).toContain(expected);
    }
  });
});
