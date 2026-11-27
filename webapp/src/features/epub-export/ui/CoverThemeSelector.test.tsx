import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COVER_THEMES } from "@/lib/epub/themes";
import type { CoverThemeId } from "@/types/ui";
import { CoverThemeSelector } from "./CoverThemeSelector";

describe("表紙テーマセレクター (CoverThemeSelector)", () => {
  it("全 5 種類の表紙テーマが正しくラジオボタングループとして描画されること", () => {
    const html = renderToStaticMarkup(
      <CoverThemeSelector selectedTheme="navy" onChange={() => undefined} />,
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="表紙テーマ"');
    for (const theme of COVER_THEMES) {
      expect(html).toContain(theme.name);
      expect(html).toContain(theme.description);
    }
  });

  it.each([
    { themeId: "navy" as CoverThemeId, label: "濃紺: チャレンジ" },
    { themeId: "slate" as CoverThemeId, label: "スレート: モダン" },
    { themeId: "ivory" as CoverThemeId, label: "アイボリー: エディトリアル" },
    { themeId: "white" as CoverThemeId, label: "白: ミニマル" },
    { themeId: "purple" as CoverThemeId, label: "紫: ダーク" },
  ])(
    "選択中のテーマ ($label / $themeId) に aria-checked='true' と tabIndex=0 が適用されること",
    ({ themeId }) => {
      const html = renderToStaticMarkup(
        <CoverThemeSelector selectedTheme={themeId} onChange={() => undefined} />,
      );

      expect(html).toContain(
        `data-theme-id="${themeId}" role="radio" aria-checked="true" tabindex="0"`,
      );
    },
  );
});
