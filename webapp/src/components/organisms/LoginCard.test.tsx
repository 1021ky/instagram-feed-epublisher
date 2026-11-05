import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoginCard } from "./LoginCard";

describe("ログインカード (LoginCard)", () => {
  it("ログインとデモ体験の導線、3つのステップ案内が正しく描画されること", () => {
    const html = renderToStaticMarkup(
      <LoginCard loadingLogin={false} onDemo={vi.fn()} onLogin={vi.fn()} />,
    );

    expect(html).toContain("FeedsToBook");
    expect(html).toContain("Instagramでログイン");
    expect(html).toContain("デモを体験する");
    expect(html).toContain("かんたん 3 ステップ");
    expect(html).toContain("投稿をしぼり込む");
    expect(html).toContain("表紙つきで整える");
    expect(html).toContain("端末ですぐに読書");
  });

  it("ログイン処理中（loadingLogin=true）のとき移動中テキストが表示されること", () => {
    const html = renderToStaticMarkup(
      <LoginCard loadingLogin={true} onDemo={vi.fn()} onLogin={vi.fn()} />,
    );

    expect(html).toContain("移動中...");
    expect(html).not.toContain("Instagramでログイン");
  });
});
