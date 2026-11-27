import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { HashtagQuickSelect } from "./HashtagQuickSelect";

/** 選択トグルとデモ制限挙動の検証に用いる 2 件のハッシュタグ候補サンプル */
const sampleSuggestions = [
  { tag: "京都カフェ", count: 5, lastUsedAt: "2026-09-20T09:00:00.000Z" },
  { tag: "朝活", count: 3, lastUsedAt: "2026-09-19T09:00:00.000Z" },
];

describe("ハッシュタグクイック選択の操作 (HashtagQuickSelect)", () => {
  it("チップのクリックで新規選択および同一タグ再クリックによる解除が通知されること", async () => {
    const onSelectTag = vi.fn();

    const screen = await render(
      <HashtagQuickSelect
        suggestions={sampleSuggestions}
        selectedHashtag="朝活"
        onSelectTag={onSelectTag}
      />,
    );

    await screen.getByRole("button", { name: /#京都カフェ/ }).click();
    expect(onSelectTag).toHaveBeenNthCalledWith(1, "京都カフェ");

    await screen.getByRole("button", { name: /#朝活/ }).click();
    expect(onSelectTag).toHaveBeenNthCalledWith(2, undefined);
  });

  it("デモモード時は disabled にせず onDemoBlocked のみを発火すること", async () => {
    const onSelectTag = vi.fn();
    const onDemoBlocked = vi.fn();

    const screen = await render(
      <HashtagQuickSelect
        suggestions={sampleSuggestions}
        isDemoMode={true}
        onSelectTag={onSelectTag}
        onDemoBlocked={onDemoBlocked}
      />,
    );

    const chip = screen.getByRole("button", { name: /#京都カフェ/ });
    await expect.element(chip).not.toBeDisabled();

    await chip.click();
    expect(onDemoBlocked).toHaveBeenCalledTimes(1);
    expect(onSelectTag).not.toHaveBeenCalled();
  });
});
