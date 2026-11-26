import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { StatusBanner } from "./StatusBanner";

describe("ステータス通知バナーの実ブラウザ動作 (StatusBanner)", () => {
  it("閉じるボタンをクリックすると onDismiss が呼ばれ、44px 以上のタップ領域を持つこと", async () => {
    const onDismiss = vi.fn();
    const screen = await render(
      <StatusBanner
        title="FeedsToBook からログアウトしました（@alice）"
        description="再ログインするには下のボタンを押してください。"
        onDismiss={onDismiss}
      />,
    );

    const dismissButton = screen.getByRole("button", { name: "通知を閉じる" });
    await expect.element(dismissButton).toBeVisible();

    const rect = dismissButton.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await dismissButton.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("onDismiss が未指定のときは閉じるボタンが表示されないこと", async () => {
    const screen = await render(<StatusBanner title="処理が完了しました" />);

    await expect.element(screen.getByRole("status")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "通知を閉じる" }))
      .not.toBeInTheDocument();
  });
});
