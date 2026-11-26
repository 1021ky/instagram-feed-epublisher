import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SelectionCheckbox } from "./SelectionCheckbox";

describe("汎用チェックボックス (SelectionCheckbox)", () => {
  it.each([
    {
      label: "チェック済み状態",
      checked: true,
      ariaLabel: "この項目を除外",
      expectedCheckedAttr: 'aria-checked="true"',
      expectedStyle: "bg-slate-900",
    },
    {
      label: "未チェック状態",
      checked: false,
      ariaLabel: "この項目を選択",
      expectedCheckedAttr: 'aria-checked="false"',
      expectedStyle: "bg-white",
    },
  ])(
    "$label のとき適切な ARIA 属性・スタイルと 44px 以上のタップ領域を描画すること",
    ({ checked, ariaLabel, expectedCheckedAttr, expectedStyle }) => {
      const html = renderToStaticMarkup(
        <SelectionCheckbox checked={checked} label={ariaLabel} onToggle={vi.fn()} />,
      );

      expect(html).toContain('role="checkbox"');
      expect(html).toContain(expectedCheckedAttr);
      expect(html).toContain(`aria-label="${ariaLabel}"`);
      expect(html).toContain(expectedStyle);
      expect(html).toContain("w-11 h-11");
      expect(html).toContain("min-h-[44px]");
    },
  );
});
