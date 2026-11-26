import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LoginCard } from "./LoginCard";

describe("ログインカードの操作とタップ領域 (LoginCard)", () => {
  it("ログインボタン・デモ体験ボタンが 44px 以上の高さを持ち、クリックで各ハンドラを呼ぶこと", async () => {
    const onLogin = vi.fn();
    const onDemo = vi.fn();
    const screen = await render(
      <LoginCard loadingLogin={false} onLogin={onLogin} onDemo={onDemo} />,
    );

    const loginButton = screen.getByRole("button", { name: "Instagramでログイン" });
    const demoButton = screen.getByRole("button", { name: /デモを体験する/ });

    expect(loginButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(demoButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await loginButton.click();
    expect(onLogin).toHaveBeenCalledTimes(1);

    await demoButton.click();
    expect(onDemo).toHaveBeenCalledTimes(1);
  });

  it("loadingLogin=true のときはログインボタンが無効化されること", async () => {
    const screen = await render(
      <LoginCard loadingLogin={true} onLogin={vi.fn()} onDemo={vi.fn()} />,
    );

    await expect.element(screen.getByRole("button", { name: "移動中..." })).toBeDisabled();
  });
});
