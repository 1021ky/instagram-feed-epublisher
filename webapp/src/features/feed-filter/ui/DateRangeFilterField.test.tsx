import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DatePreset } from "@/types/ui";
import { DateRangeFilterField } from "./DateRangeFilterField";

describe("期間指定フィールド (DateRangeFilterField)", () => {
  it.each<{
    label: string;
    activePreset: DatePreset;
    isDemoMode: boolean;
    expectedPressedCount: number;
  }>([
    {
      label: "直近100日選択中",
      activePreset: "100days",
      isDemoMode: false,
      expectedPressedCount: 1,
    },
    { label: "直近30日選択中", activePreset: "30days", isDemoMode: false, expectedPressedCount: 1 },
    { label: "全期間選択中", activePreset: "all", isDemoMode: false, expectedPressedCount: 1 },
    {
      label: "カスタム期間（全プリセット非選択）",
      activePreset: "custom",
      isDemoMode: false,
      expectedPressedCount: 0,
    },
    {
      label: "デモモード（readOnly かつ非 disabled）",
      activePreset: "100days",
      isDemoMode: true,
      expectedPressedCount: 1,
    },
  ])(
    "$label でプリセット状態と日付入力欄が正しく描画されること",
    ({ activePreset, isDemoMode, expectedPressedCount }) => {
      const html = renderToStaticMarkup(
        <DateRangeFilterField
          startDate="2026-06-13"
          endDate="2026-09-21"
          activePreset={activePreset}
          onPresetSelect={vi.fn()}
          onStartDateChange={vi.fn()}
          onEndDateChange={vi.fn()}
          isDemoMode={isDemoMode}
          onDemoBlocked={vi.fn()}
        />,
      );

      expect(html).toContain('role="group"');
      expect(html).toContain('aria-label="期間プリセット"');
      expect(html).toContain("直近100日");
      expect(html).toContain("直近30日");
      expect(html).toContain("全期間");
      expect(html).toContain("開始日");
      expect(html).toContain("終了日");
      expect(html.match(/aria-pressed="true"/g) ?? []).toHaveLength(expectedPressedCount);
      expect(html).not.toContain('disabled=""');
      if (isDemoMode) {
        expect(html).toMatch(/readonly/i);
        expect(html).toContain("cursor-not-allowed");
      }
    },
  );
});
