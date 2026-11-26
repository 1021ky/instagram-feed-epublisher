import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FeedFilterSummaryCard } from "./FeedFilterSummaryCard";

describe("折りたたみ絞り込みサマリーカード (FeedFilterSummaryCard)", () => {
  it("サマリー文字列と展開ボタンのアクセシビリティ属性が正しく描画されること", () => {
    const summaryText = "#100日チャレンジ / 直近100日 / 84件取得中";
    const html = renderToStaticMarkup(
      <FeedFilterSummaryCard summaryText={summaryText} onExpand={vi.fn()} />,
    );

    expect(html).toContain('aria-label="フィード絞り込み条件サマリー"');
    expect(html).toContain(`aria-label="絞り込み条件を展開: ${summaryText}"`);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("絞り込み条件");
    expect(html).toContain(summaryText);
    expect(html).toContain("条件を変更");
    expect(html).toContain("min-h-[44px]");
  });
});
