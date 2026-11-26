import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";

describe("サイトフッター (SiteFooter)", () => {
  it("法的ページへのリンクが正しく描画されること", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('role="contentinfo"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/data-deletion"');
    expect(html).toContain("プライバシーポリシー");
    expect(html).toContain("利用規約");
    expect(html).toContain("データ削除手順");
    expect(html).toContain("© FeedsToBook");
  });
});
