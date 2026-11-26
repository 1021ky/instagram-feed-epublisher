import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DemoModeNoticeBanner } from "./DemoModeNoticeBanner";

describe("デモ体験モード案内バナー (DemoModeNoticeBanner)", () => {
  it.each([
    {
      label: "通常のデモ案内状態",
      isBlocked: false,
      expectedText: "デモ体験モード：条件は固定サンプルです（ログイン後に自由に変更できます）",
      expectDismissButton: false,
    },
    {
      label: "条件変更ブロック警告状態",
      isBlocked: true,
      expectedText: "デモ体験中は条件を変更できません（ログイン後に自由に変更できます）",
      expectDismissButton: true,
    },
  ])(
    "$label で適切な文言と閉じるボタンが描画されること",
    ({ isBlocked, expectedText, expectDismissButton }) => {
      const html = renderToStaticMarkup(
        <DemoModeNoticeBanner isBlocked={isBlocked} onDismiss={vi.fn()} />,
      );

      expect(html).toContain('role="status"');
      expect(html).toContain(expectedText);
      if (expectDismissButton) {
        expect(html).toContain('aria-label="案内を閉じる"');
      } else {
        expect(html).not.toContain('aria-label="案内を閉じる"');
      }
    },
  );
});
