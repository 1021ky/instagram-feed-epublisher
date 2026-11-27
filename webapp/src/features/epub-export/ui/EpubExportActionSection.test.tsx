import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EpubExportActionSection } from "./EpubExportActionSection";

describe("EPUB 生成アクションセクション (EpubExportActionSection)", () => {
  it.each([
    {
      label: "選択件数あり・待機中",
      selectedCount: 12,
      isGenerating: false,
      isCompleted: false,
      expectedLabel: "EPUBを生成してダウンロード (12件収録)",
      expectDisabled: false,
      expectCompletedBanner: false,
    },
    {
      label: "選択件数 0 件",
      selectedCount: 0,
      isGenerating: false,
      isCompleted: false,
      expectedLabel: "EPUBを生成してダウンロード (0件収録)",
      expectDisabled: true,
      expectCompletedBanner: false,
    },
    {
      label: "EPUB 生成処理中",
      selectedCount: 5,
      isGenerating: true,
      isCompleted: false,
      expectedLabel: "EPUB生成中...",
      expectDisabled: true,
      expectCompletedBanner: false,
    },
    {
      label: "EPUB 書き出し完了後",
      selectedCount: 5,
      isGenerating: false,
      isCompleted: true,
      expectedLabel: "EPUBを生成してダウンロード (5件収録)",
      expectDisabled: false,
      expectCompletedBanner: true,
    },
  ])(
    "$label の場合にボタンラベル・無効状態・完了バナーが期待通り描画されること",
    ({
      selectedCount,
      isGenerating,
      isCompleted,
      expectedLabel,
      expectDisabled,
      expectCompletedBanner,
    }) => {
      const html = renderToStaticMarkup(
        <EpubExportActionSection
          selectedCount={selectedCount}
          isGenerating={isGenerating}
          isCompleted={isCompleted}
          onGenerate={() => undefined}
          onReopenModal={() => undefined}
        />,
      );

      expect(html).toContain(expectedLabel);
      if (expectDisabled) {
        expect(html).toContain('disabled=""');
      } else {
        expect(html).not.toContain('disabled=""');
      }

      if (expectCompletedBanner) {
        expect(html).toContain('role="status"');
        expect(html).toContain("EPUBの書き出しが完了しました");
        expect(html).toContain("転送ガイド・ダウンロードを再表示");
      } else {
        expect(html).not.toContain("EPUBの書き出しが完了しました");
      }
    },
  );
});
