import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoginStepsGuide } from "./LoginStepsGuide";

describe("ログイン画面の 3 ステップ案内 (LoginStepsGuide)", () => {
  it("かんたん 3 ステップの見出しと各手順が描画されること", () => {
    const html = renderToStaticMarkup(<LoginStepsGuide />);

    expect(html).toContain("かんたん 3 ステップ");
    expect(html).toContain("投稿をしぼり込む");
    expect(html).toContain("表紙つきで整える");
    expect(html).toContain("端末ですぐに読書");
  });
});
