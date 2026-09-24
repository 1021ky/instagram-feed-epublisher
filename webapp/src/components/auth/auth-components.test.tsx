import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Navbar } from "./Navbar";

describe("認証 UI", () => {
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

  it("デモモードでは退会導線を表示しないこと", () => {
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
  });
});
