import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { EpubExportActionSection } from "./EpubExportActionSection";

describe("EPUB 生成アクションセクションの操作 (EpubExportActionSection)", () => {
  it("生成ボタンと完了バナー再表示ボタンが動作し、44px以上のタップ領域を満たすこと", async () => {
    const onGenerate = vi.fn();
    const onReopenModal = vi.fn();
    const screen = await render(
      <EpubExportActionSection
        selectedCount={3}
        isGenerating={false}
        isCompleted={true}
        onGenerate={onGenerate}
        onReopenModal={onReopenModal}
      />,
    );

    const generateButton = screen.getByRole("button", {
      name: /EPUBを生成してダウンロード \(3件収録\)/,
    });
    const reopenButton = screen.getByRole("button", {
      name: "転送ガイド・ダウンロードを再表示",
    });

    expect(generateButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(reopenButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await generateButton.click();
    expect(onGenerate).toHaveBeenCalledTimes(1);

    await reopenButton.click();
    expect(onReopenModal).toHaveBeenCalledTimes(1);
  });

  it("選択件数が 0 件のときは生成ボタンが無効化されること", async () => {
    const screen = await render(
      <EpubExportActionSection
        selectedCount={0}
        isGenerating={false}
        isCompleted={false}
        onGenerate={vi.fn()}
        onReopenModal={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: /EPUBを生成してダウンロード \(0件収録\)/ }))
      .toBeDisabled();
  });
});
