import { useState } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import type { CoverThemeId } from "@/types/ui";
import { CoverThemeSelector } from "./CoverThemeSelector";

/**
 * 選択状態の切替と矢印キー移動を実ブラウザ上で検証するためのステート付きラッパー。
 */
function StatefulCoverThemeSelector({ initialTheme = "navy" }: { initialTheme?: CoverThemeId }) {
  const [selectedTheme, setSelectedTheme] = useState<CoverThemeId>(initialTheme);

  return <CoverThemeSelector selectedTheme={selectedTheme} onChange={setSelectedTheme} />;
}

describe("表紙テーマセレクターの操作 (CoverThemeSelector)", () => {
  it("クリックで別の表紙テーマへ選択を切り替えられること", async () => {
    const screen = await render(<StatefulCoverThemeSelector initialTheme="navy" />);
    const group = screen.getByRole("radiogroup", { name: "表紙テーマ" });

    await group.getByRole("radio", { name: /アイボリー/ }).click();

    await expect
      .element(group.getByRole("radio", { checked: true }))
      .toHaveAttribute("data-theme-id", "ivory");
  });

  it("左右矢印キーで先頭と末尾を含めて循環選択しフォーカスも追従すること", async () => {
    const screen = await render(<StatefulCoverThemeSelector initialTheme="navy" />);
    const group = screen.getByRole("radiogroup", { name: "表紙テーマ" });

    await group.getByRole("radio", { checked: true }).click();
    await userEvent.keyboard("{ArrowRight}");

    const slateRadio = group.getByRole("radio", { checked: true });
    await expect.element(slateRadio).toHaveAttribute("data-theme-id", "slate");
    await expect.element(slateRadio).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowLeft}");

    const purpleRadio = group.getByRole("radio", { checked: true });
    await expect.element(purpleRadio).toHaveAttribute("data-theme-id", "purple");
    await expect.element(purpleRadio).toHaveFocus();
  });
});
