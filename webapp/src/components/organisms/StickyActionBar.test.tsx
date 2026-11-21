import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StickyActionBar } from "./StickyActionBar";

describe("固定アクションバー (StickyActionBar)", () => {
  it("最下部固定スタイル、Safe Area、選択件数、次へボタンが正しく描画されること", () => {
    const html = renderToStaticMarkup(
      <StickyActionBar
        selectedCount={42}
        totalCount={50}
        onNext={vi.fn()}
        nextLabel="本の設定に進む"
      />,
    );

    // 固定表示 & Safe Area
    expect(html).toContain("fixed bottom-0");
    expect(html).toContain("pb-safe");

    // 選択件数表示
    expect(html).toContain("42");
    expect(html).toContain("/ 50 件");
    expect(html).toContain("本の設定に進む");

    // タップ領域 48px
    expect(html).toContain("min-h-[48px]");
  });

  it("選択件数が0件のときに次へボタンが disabled になること", () => {
    const html = renderToStaticMarkup(<StickyActionBar selectedCount={0} onNext={vi.fn()} />);

    expect(html).toContain("disabled");
    expect(html).toContain("選択中:");
    expect(html).toContain("0");
  });

  it("onBack が指定された場合に戻るボタンが表示されること", () => {
    const html = renderToStaticMarkup(
      <StickyActionBar selectedCount={10} onNext={vi.fn()} onBack={vi.fn()} backLabel="前へ" />,
    );

    expect(html).toContain("前へ");
  });
});
