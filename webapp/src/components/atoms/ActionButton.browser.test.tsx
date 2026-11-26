import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ActionButton, type ActionButtonVariant } from "./ActionButton";

describe("アクションボタンの操作とタップ領域 (ActionButton)", () => {
  it.each<{ label: string; variant: ActionButtonVariant }>([
    { label: "primary バリアント", variant: "primary" },
    { label: "gradient バリアント", variant: "gradient" },
    { label: "secondary バリアント", variant: "secondary" },
    { label: "danger バリアント", variant: "danger" },
  ])("$label で 44px 以上の高さを確保しクリックで onClick が呼ばれること", async ({ variant }) => {
    const onClick = vi.fn();
    const screen = await render(
      <ActionButton variant={variant} onClick={onClick}>
        実行する
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "実行する" });
    await expect.element(button).toBeVisible();

    const rect = button.element().getBoundingClientRect();
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled または isLoading が true のときはボタンが無効化されること", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <ActionButton isLoading={true} onClick={onClick}>
        生成中...
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "生成中..." });
    await expect.element(button).toBeDisabled();
    expect(button.element().getAttribute("aria-busy")).toBe("true");
    expect(onClick).not.toHaveBeenCalled();
  });
});
