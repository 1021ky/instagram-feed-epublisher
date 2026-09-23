/**
 * @file EPUB UI コンポーネントの静的レンダリングテスト
 */
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { CoverThemeSelector } from "@/components/epub/CoverThemeSelector";
import { EpubCustomizeStep } from "@/components/epub/EpubCustomizeStep";
import { ExportModal } from "@/components/epub/ExportModal";

describe("EPUB UI components", () => {
  test("CoverThemeSelector renders all 5 themes", () => {
    const html = renderToStaticMarkup(
      <CoverThemeSelector selectedTheme="navy" onChange={() => undefined} />,
    );

    expect(html).toContain("濃紺: チャレンジ");
    expect(html).toContain("スレート: モダン");
    expect(html).toContain("アイボリー: エディトリアル");
    expect(html).toContain("白: ミニマル");
    expect(html).toContain("紫: ダーク");
  });

  test("EpubCustomizeStep renders title, order, and theme controls", () => {
    const html = renderToStaticMarkup(
      <EpubCustomizeStep
        defaultTitle="@demo_userの投稿記録"
        settings={{
          title: "@demo_userの投稿記録",
          subtitle: "100日チャレンジ",
          author: "@demo_user",
          coverTheme: "navy",
          sortOrder: "asc",
          contact: "demo@example.com",
          instagramUrl: "https://instagram.com/demo_user",
        }}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain("EPUBの装丁を整える");
    expect(html).toContain("古い順（Day 1 → 100 推奨）");
    expect(html).toContain("表紙テーマ");
  });

  test("ExportModal renders completion guide and download action", () => {
    const onDownload = vi.fn();
    const html = renderToStaticMarkup(
      <ExportModal
        isOpen
        progress={{
          status: "completed",
          progress: 100,
          message: "完了しました",
          downloadUrl: "blob:demo",
        }}
        onClose={() => undefined}
        onDownload={onDownload}
      />,
    );

    expect(html).toContain("Send to Kindle");
    expect(html).toContain("Apple Books / Kobo");
    expect(html).toContain("EPUBをダウンロード");
  });
});
