import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepCardHeader } from "./StepCardHeader";

describe("ステップカードヘッダー (StepCardHeader)", () => {
  it.each([
    {
      label: "基本表示（番号・タイトル・説明文・下線あり）",
      props: {
        stepNumber: 1,
        title: "Step 1: フィードの絞り込み",
        description: "ハッシュタグや期間を指定して投稿を取得します",
      },
      expectedSubstrings: [
        ">1</span>",
        "Step 1: フィードの絞り込み",
        "ハッシュタグや期間を指定して投稿を取得します",
        "border-b border-slate-100",
      ],
      unexpectedSubstrings: [],
    },
    {
      label: "説明文なし・右側スロットあり・下線なし",
      props: {
        stepNumber: 2,
        title: "Step 2: 投稿の確認・選択",
        rightSlot: <span>選択中: 10 / 20 件</span>,
        divider: false,
        className: "mb-4",
      },
      expectedSubstrings: [">2</span>", "Step 2: 投稿の確認・選択", "選択中: 10 / 20 件", "mb-4"],
      unexpectedSubstrings: ["border-b border-slate-100", "<p "],
    },
  ])(
    "$label のとき、期待通りのヘッダー構造で描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<StepCardHeader {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
