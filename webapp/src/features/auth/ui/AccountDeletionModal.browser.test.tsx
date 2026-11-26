import { describe, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { AccountDeletionModal } from "./AccountDeletionModal";

describe("退会確認・完了モーダルの操作 (AccountDeletionModal)", () => {
  it.each([
    {
      label: "キャンセルボタンをクリックした場合",
      trigger: async (screen: Awaited<ReturnType<typeof render>>) => {
        await screen.getByRole("button", { name: "キャンセル" }).click();
      },
    },
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
  ])("確認ステップで $label に onClose が呼ばれること", async ({ trigger }) => {
    const onClose = vi.fn();
    const screen = await render(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        onConfirm={vi.fn()}
        onClose={onClose}
        onCompleteClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await trigger(screen);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("確認ステップの右上閉じるボタンが 44px 以上のタップ領域を持ち、カード本体クリックでは閉じないこと", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        onConfirm={vi.fn()}
        onClose={onClose}
        onCompleteClose={vi.fn()}
      />,
    );

    const closeButton = screen.getByRole("button", { name: "モーダルを閉じる" });
    const rect = closeButton.element().getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    await screen.getByRole("heading", { name: "FeedsToBook を退会しますか？" }).click();

    expect(onClose).not.toHaveBeenCalled();
  });

  it("退会実行ボタンをクリックすると onConfirm が呼ばれること", async () => {
    const onConfirm = vi.fn();
    const screen = await render(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        onConfirm={onConfirm}
        onClose={vi.fn()}
        onCompleteClose={vi.fn()}
      />,
    );

    await screen.getByRole("button", { name: "退会を実行する" }).click();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("退会処理中は Escape キーやバックドロップ操作でも閉じずボタンが無効化されること", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        isDeleting={true}
        onConfirm={vi.fn()}
        onClose={onClose}
        onCompleteClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "モーダルを閉じる" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "退会処理中…" })).toBeDisabled();

    await userEvent.keyboard("{Escape}");
    const backdrop = screen.container.querySelector('[role="presentation"]');
    (backdrop as HTMLElement).click();

    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "閉じる（トップページへ）ボタンをクリックした場合",
      trigger: async (screen: Awaited<ReturnType<typeof render>>) => {
        await screen.getByRole("button", { name: "閉じる（トップページへ）" }).click();
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
  ])("完了ステップで $label に onCompleteClose が呼ばれること", async ({ trigger }) => {
    const onCompleteClose = vi.fn();
    const screen = await render(
      <AccountDeletionModal
        isOpen={true}
        step="completed"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        onCompleteClose={onCompleteClose}
      />,
    );

    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await trigger(screen);

    expect(onCompleteClose).toHaveBeenCalledTimes(1);
  });
});
