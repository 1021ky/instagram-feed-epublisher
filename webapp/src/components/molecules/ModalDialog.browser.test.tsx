import { describe, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { ModalDialog } from "./ModalDialog";

describe("モーダルダイアログの操作 (ModalDialog)", () => {
  it.each([
    {
      label: "右上の閉じるボタンをクリックした場合",
      trigger: async (screen: Awaited<ReturnType<typeof render>>) => {
        await screen.getByRole("button", { name: "モーダルを閉じる" }).click();
      },
    },
    {
      label: "Escape キーを押下した場合",
      trigger: async () => {
        await userEvent.keyboard("{Escape}");
      },
    },
    {
      label: "背景のバックドロップをクリックした場合",
      trigger: async (screen: Awaited<ReturnType<typeof render>>) => {
        const backdrop = screen.container.querySelector('[role="presentation"]');
        expect(backdrop).not.toBeNull();
        (backdrop as HTMLElement).click();
      },
    },
  ])("closeDisabled=false で $label に onClose が呼ばれること", async ({ trigger }) => {
    const onClose = vi.fn();
    const screen = await render(
      <ModalDialog isOpen={true} onClose={onClose} labelledBy="dialog-title" showCloseButton={true}>
        <h2 id="dialog-title">確認ダイアログ</h2>
        <p>本文コンテンツ</p>
      </ModalDialog>,
    );

    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await trigger(screen);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("右上閉じるボタンが 44px 以上のタップ領域を持ち、カード本体クリックでは閉じないこと", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <ModalDialog isOpen={true} onClose={onClose} labelledBy="dialog-title" showCloseButton={true}>
        <h2 id="dialog-title">確認ダイアログ</h2>
        <p>本文コンテンツ</p>
      </ModalDialog>,
    );

    const closeButton = screen.getByRole("button", { name: "モーダルを閉じる" });
    const rect = closeButton.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await screen.getByRole("heading", { name: "確認ダイアログ" }).click();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closeDisabled=true のときは Escape キー・バックドロップ・閉じるボタンのいずれでも閉じないこと", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <ModalDialog
        isOpen={true}
        onClose={onClose}
        labelledBy="dialog-title"
        showCloseButton={true}
        closeDisabled={true}
      >
        <h2 id="dialog-title">処理中ダイアログ</h2>
        <p>完了までお待ちください</p>
      </ModalDialog>,
    );

    await expect.element(screen.getByRole("button", { name: "モーダルを閉じる" })).toBeDisabled();

    await userEvent.keyboard("{Escape}");
    const backdrop = screen.container.querySelector('[role="presentation"]');
    (backdrop as HTMLElement).click();

    expect(onClose).not.toHaveBeenCalled();
  });
});
