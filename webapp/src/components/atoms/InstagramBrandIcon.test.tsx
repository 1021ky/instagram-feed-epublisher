import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstagramBrandIcon } from "./InstagramBrandIcon";

describe("Instagram ブランドアイコン (InstagramBrandIcon)", () => {
  it.each([
    {
      label: "デフォルト（装飾用として aria-hidden=true）",
      props: {},
      expectedSubstrings: ['viewBox="0 0 24 24"', 'aria-hidden="true"', "w-4 h-4", "fill-current"],
      unexpectedSubstrings: ['role="img"', "aria-label="],
    },
    {
      label: "カスタムサイズクラス指定",
      props: { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" },
      expectedSubstrings: ["w-3.5 h-3.5 sm:w-4 sm:h-4", 'aria-hidden="true"'],
      unexpectedSubstrings: ['role="img"'],
    },
    {
      label: "aria-label 指定時は role=img として公開される",
      props: { "aria-label": "Instagram" },
      expectedSubstrings: ['aria-label="Instagram"', 'role="img"', 'aria-hidden="false"'],
      unexpectedSubstrings: ['aria-hidden="true"'],
    },
  ])(
    "$label のとき、期待通りの SVG マークアップが描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<InstagramBrandIcon {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
