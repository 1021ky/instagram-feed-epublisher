import { describe, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import type { ExportProgress } from "@/types/ui";
import { ExportModal } from "./ExportModal";

/** 完了モーダルの操作検証に用いる進捗データ */
const completedProgress: ExportProgress = {
  status: "completed",
  progress: 100,
  message: "ダウンロードが始まりました。",
  downloadUrl: "blob:test-epub",
};

/** 生成中モーダルの閉じ制御検証に用いる進捗データ */
const generatingProgress: ExportProgress = {
  status: "generating",
  progress: 40,
  message: "投稿を並び替えてEPUBを生成しています…",
};

/** エラーモーダルの操作検証に用いる進捗データ */
const errorProgress: ExportProgress = {
  status: "error",
  progress: 0,
  message: "EPUBの生成に失敗しました。",
  error: "サーバーが一時的に混雑しています",
};

describe("エクスポートモーダルの操作 (ExportModal)", () => {
  it("完了状態でダウンロードボタン・閉じるボタンが動作し、44px以上のタップ領域を満たすこと", async () => {
    const onDownload = vi.fn();
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal
        isOpen={true}
        progress={completedProgress}
        onClose={onClose}
        onDownload={onDownload}
      />,
    );

    await expect.element(screen.getByRole("dialog")).toBeVisible();

    const downloadButton = screen.getByRole("button", { name: "EPUBをダウンロード" });
    const closeButton = screen.getByRole("button", { name: "閉じる" });
    expect(downloadButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(closeButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await downloadButton.click();
    expect(onDownload).toHaveBeenCalledTimes(1);

    await closeButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("生成中は Escape キーと背景クリックで閉じず、バックグラウンドで待つボタンのみで閉じられること", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal isOpen={true} progress={generatingProgress} onClose={onClose} />,
    );

    await expect.element(screen.getByRole("progressbar", { name: "EPUB生成進捗" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await screen.getByRole("presentation").click({ position: { x: 4, y: 4 } });
    expect(onClose).not.toHaveBeenCalled();

    const backgroundButton = screen.getByRole("button", {
      name: "バックグラウンドで待つ（完了時に自動表示）",
    });
    expect(backgroundButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await backgroundButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: "完了状態", progress: completedProgress },
    { label: "エラー状態", progress: errorProgress },
  ])("$label では Escape キーと背景クリックでモーダルを閉じられること", async ({ progress }) => {
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal isOpen={true} progress={progress} onClose={onClose} />,
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await screen.getByRole("presentation").click({ position: { x: 4, y: 4 } });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("エラー状態でエラーメッセージが表示され閉じるボタンで閉じられること", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal isOpen={true} progress={errorProgress} onClose={onClose} />,
    );

    await expect.element(screen.getByText("サーバーが一時的に混雑しています")).toBeVisible();
    await screen.getByRole("button", { name: "閉じる" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
