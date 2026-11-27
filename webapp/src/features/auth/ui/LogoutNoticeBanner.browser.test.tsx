import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LogoutNoticeBanner } from "./LogoutNoticeBanner";

describe("ログアウト完了通知バナーの操作 (LogoutNoticeBanner)", () => {
  it("閉じるボタンのクリックで onDismiss が呼ばれ、44px以上のタップ領域を満たすこと", async () => {
    const onDismiss = vi.fn();
    const screen = await render(<LogoutNoticeBanner username="alice" onDismiss={onDismiss} />);

    await expect
      .element(screen.getByText("FeedsToBook からログアウトしました（@alice）"))
      .toBeVisible();

    const dismissButton = screen.getByRole("button", { name: "通知を閉じる" });
    const rect = dismissButton.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await dismissButton.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
