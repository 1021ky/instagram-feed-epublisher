import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SegmentedControl } from "./SegmentedControl";

/** 期間プリセット切替の操作・タップ領域検証に用いる 3 択オプション定義 */
const PRESET_OPTIONS = [
  { value: "100days", label: "直近100日" },
  { value: "30days", label: "直近30日" },
  { value: "all", label: "全期間" },
] as const;

describe("セグメント切替コントロールの操作 (SegmentedControl)", () => {
  it("選択肢クリックで onChange が呼ばれ、全ボタンが 44px 以上の高さと aria-pressed を持つこと", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <SegmentedControl
        ariaLabel="期間プリセット"
        options={PRESET_OPTIONS}
        value="30days"
        onChange={onChange}
      />,
    );

    const group = screen.getByRole("group", { name: "期間プリセット" });
    await expect.element(group).toBeVisible();

    const btn100 = screen.getByRole("button", { name: "直近100日" });
    const btn30 = screen.getByRole("button", { name: "直近30日" });
    const btnAll = screen.getByRole("button", { name: "全期間" });

    expect(btn30.element().getAttribute("aria-pressed")).toBe("true");
    expect(btn100.element().getAttribute("aria-pressed")).toBe("false");

    for (const btn of [btn100, btn30, btnAll]) {
      const rect = btn.element().getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }

    await btn100.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("100days");
  });

  it("readOnly=true のときはクリックで onChange ではなく onReadOnlyClick が呼ばれること", async () => {
    const onChange = vi.fn();
    const onReadOnlyClick = vi.fn();
    const screen = await render(
      <SegmentedControl
        ariaLabel="期間プリセット"
        options={PRESET_OPTIONS}
        value="100days"
        readOnly={true}
        onChange={onChange}
        onReadOnlyClick={onReadOnlyClick}
      />,
    );

    const btn30 = screen.getByRole("button", { name: "直近30日" });
    await expect.element(btn30).toBeEnabled();

    await btn30.click();
    expect(onChange).not.toHaveBeenCalled();
    expect(onReadOnlyClick).toHaveBeenCalledTimes(1);
  });

  it("disabled=true のときはボタンが無効化されクリックハンドラが呼ばれないこと", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <SegmentedControl
        ariaLabel="期間プリセット"
        options={PRESET_OPTIONS}
        value="100days"
        disabled={true}
        onChange={onChange}
      />,
    );

    const btn30 = screen.getByRole("button", { name: "直近30日" });
    await expect.element(btn30).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
