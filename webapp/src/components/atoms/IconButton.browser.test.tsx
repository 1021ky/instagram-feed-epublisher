import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { IconButton } from "./IconButton";

describe("アイコンボタンの操作とタップ領域 (IconButton)", () => {
  it("クリックで onClick が呼ばれ、44px 以上のタップ領域を確保すること", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <IconButton
        aria-label="通知を閉じる"
        icon={<span aria-hidden="true">×</span>}
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: "通知を閉じる" });
    await expect.element(button).toBeVisible();

    const rect = button.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled=true のときはボタンが無効化され onClick が呼ばれないこと", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <IconButton
        aria-label="モーダルを閉じる"
        icon={<span aria-hidden="true">×</span>}
        disabled={true}
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: "モーダルを閉じる" });
    await expect.element(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
