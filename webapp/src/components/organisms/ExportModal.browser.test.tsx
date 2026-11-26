import { describe, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { ExportModal } from "./ExportModal";

describe("エクスポートモーダルの実ブラウザ動作 (ExportModal)", () => {
  it("完了状態でダウンロードボタンと閉じるボタンがそれぞれ対応するハンドラを呼ぶこと", async () => {
    const onDownload = vi.fn();
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal
        isOpen={true}
        progress={{
          status: "completed",
          progress: 100,
          message: "ダウンロードが始まりました。",
          downloadUrl: "blob:test-epub",
        }}
        onClose={onClose}
        onDownload={onDownload}
      />,
    );

    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await screen.getByRole("button", { name: "EPUBをダウンロード" }).click();
    expect(onDownload).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "閉じる" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("生成中はバックグラウンドで待つボタンで閉じられ、Escape キーでは誤って閉じないこと", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal
        isOpen={true}
        progress={{
          status: "generating",
          progress: 40,
          message: "投稿を並び替えてEPUBを生成しています…",
        }}
        onClose={onClose}
      />,
    );

    await expect.element(screen.getByRole("progressbar", { name: "EPUB生成進捗" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    await screen
      .getByRole("button", { name: "バックグラウンドで待つ（完了時に自動表示）" })
      .click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("エラー状態でエラーメッセージが表示され閉じるボタンで閉じられること", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <ExportModal
        isOpen={true}
        progress={{
          status: "error",
          progress: 0,
          message: "EPUBの生成に失敗しました。",
          error: "サーバーが一時的に混雑しています",
        }}
        onClose={onClose}
      />,
    );

    await expect.element(screen.getByText("サーバーが一時的に混雑しています")).toBeVisible();
    await screen.getByRole("button", { name: "閉じる" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
