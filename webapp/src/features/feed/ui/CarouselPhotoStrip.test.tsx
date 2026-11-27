import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CarouselPhotoStrip } from "./CarouselPhotoStrip";

describe("カルーセル写真選択リスト (CarouselPhotoStrip)", () => {
  it("2枚以上の写真がある場合に横スクロール領域と m/n枚 ラベルを描画すること", () => {
    const html = renderToStaticMarkup(
      <CarouselPhotoStrip
        photos={[
          { id: "c1", url: "https://example.com/1.jpg", selected: true },
          { id: "c2", url: "https://example.com/2.jpg", selected: false },
          { id: "c3", url: "https://example.com/3.jpg", selected: true },
        ]}
        onTogglePhoto={vi.fn()}
      />,
    );

    expect(html).toContain("収録する写真を選択（2/3枚）");
    expect(html).not.toContain("1枚1ページ");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("shrink-0");
    expect(html).toContain('aria-label="カルーセル画像の収録選択"');
    expect(html).toContain('aria-label="画像 1 をEPUBから除外"');
    expect(html).toContain('aria-label="画像 2 をEPUBに収録"');
    expect(html).toContain('aria-label="画像 3 をEPUBから除外"');
  });

  it("1枚以下の場合は何も描画しないこと", () => {
    const html = renderToStaticMarkup(
      <CarouselPhotoStrip
        photos={[{ id: "c1", url: "https://example.com/1.jpg", selected: true }]}
      />,
    );
    expect(html).toBe("");
  });
});
