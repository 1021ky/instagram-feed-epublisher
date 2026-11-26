import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoginCard } from "./LoginCard";

describe("ログインカード (LoginCard)", () => {
  it.each([
    {
      label: "通常表示（loadingLogin=false）",
      loadingLogin: false,
      expectedSubstrings: [
        "FeedsToBook",
        "Instagramでログイン",
        "デモを体験する",
        "かんたん 3 ステップ",
        "投稿をしぼり込む",
        "表紙つきで整える",
        "端末ですぐに読書",
      ],
      unexpectedSubstrings: ["別のアカウントでログイン", "移動中...", 'disabled=""'],
    },
    {
      label: "ログイン処理中（loadingLogin=true）",
      loadingLogin: true,
      expectedSubstrings: ["移動中...", 'disabled=""', 'aria-busy="true"'],
      unexpectedSubstrings: ["Instagramでログイン"],
    },
  ])(
    "$label で期待通りの表示になること",
    ({ loadingLogin, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(
        <LoginCard loadingLogin={loadingLogin} onDemo={vi.fn()} onLogin={vi.fn()} />,
      );

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
