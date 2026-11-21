import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Navbar } from "./Navbar";

describe("ナビゲーションバー (Navbar)", () => {
  it("user が未指定または null のときは何も描画しないこと", () => {
    const html = renderToStaticMarkup(<Navbar user={null} />);
    expect(html).toBe("");
  });

  it("ログイン済み時は退会とログアウトの導線を表示すること", () => {
    const html = renderToStaticMarkup(
      <Navbar
        user={{ id: "1", username: "demo_user", displayName: "Demo User" }}
        onDeleteAccount={() => undefined}
        onLogout={() => undefined}
      />,
    );

    expect(html).toContain("退会（連携解除）");
    expect(html).toContain("ログアウト");
    expect(html).toContain("@demo_user");
  });

  it("デモモードでは退会導線を表示せず、デモ終了ボタンを表示すること", () => {
    const html = renderToStaticMarkup(
      <Navbar
        user={{ id: "1", username: "demo_user", displayName: "Demo User" }}
        isDemoMode
        onDeleteAccount={() => undefined}
        onLogout={() => undefined}
      />,
    );

    expect(html).not.toContain("退会（連携解除）");
    expect(html).toContain("デモを終了");
    expect(html).toContain("デモ体験モード");
  });
});
