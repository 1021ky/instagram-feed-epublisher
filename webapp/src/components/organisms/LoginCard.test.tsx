import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoginCard } from "./LoginCard";

describe("ログインカード (LoginCard)", () => {
  it("ログインと別アカウント導線、デモ体験の導線、3つのステップ案内が正しく描画されること", () => {
    const html = renderToStaticMarkup(
      <LoginCard
        loadingLogin={false}
        onDemo={vi.fn()}
        onLogin={vi.fn()}
        onForceReauthLogin={vi.fn()}
      />,
    );

    expect(html).toContain("FeedsToBook");
    expect(html).toContain("Instagramでログイン");
    expect(html).toContain("別のアカウントでログイン");
    expect(html).toContain("デモを体験する");
    expect(html).toContain("かんたん 3 ステップ");
    expect(html).toContain("投稿をしぼり込む");
    expect(html).toContain("表紙つきで整える");
    expect(html).toContain("端末ですぐに読書");
  });

  it("ログイン処理中（loadingLogin=true）のとき移動中テキストが表示されログインボタンが無効化されること", () => {
    const html = renderToStaticMarkup(
      <LoginCard
        loadingLogin={true}
        onDemo={vi.fn()}
        onLogin={vi.fn()}
        onForceReauthLogin={vi.fn()}
      />,
    );

    expect(html).toContain("移動中...");
    expect(html).not.toContain("Instagramでログイン");
    expect(html).toContain('disabled=""');
  });

  it.each([
    { label: "通常時 (justLoggedOut=false)", justLoggedOut: false, shouldShowNotice: false },
    { label: "ログアウト直後 (justLoggedOut=true)", justLoggedOut: true, shouldShowNotice: true },
  ])(
    "$label のとき、Instagram ログイン状態維持の補足案内表示が期待通りであること",
    ({ justLoggedOut, shouldShowNotice }) => {
      const html = renderToStaticMarkup(
        <LoginCard
          loadingLogin={false}
          onDemo={vi.fn()}
          onLogin={vi.fn()}
          onForceReauthLogin={vi.fn()}
          justLoggedOut={justLoggedOut}
        />,
      );

      if (shouldShowNotice) {
        expect(html).toContain("本アプリからログアウトしました");
        expect(html).toContain("Instagram ログイン状態は維持されている");
      } else {
        expect(html).not.toContain("本アプリからログアウトしました");
      }
    },
  );
});
