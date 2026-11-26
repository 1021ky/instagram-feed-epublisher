import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { FeedFilterOptions } from "@/types/ui";
import { calculatePresetDates } from "../model/date-preset";
import { FeedFilterStep } from "./FeedFilterStep";

const baseFilter: FeedFilterOptions = {
  hashtag: "",
  startDate: "2026-08-22",
  endDate: "2026-09-21",
  maxCount: 200,
};

const sampleSuggestions = [{ tag: "京都カフェ", count: 5, lastUsedAt: "2026-09-20T09:00:00.000Z" }];

describe("フィード絞り込みステップのブラウザ操作 (FeedFilterStep)", () => {
  it("期間プリセット切替とハッシュタグチップ選択で onFilterChange が呼ばれ、送信で onSubmit が呼ばれること", async () => {
    const onFilterChange = vi.fn();
    const onSubmit = vi.fn();

    const screen = await render(
      <FeedFilterStep
        filter={baseFilter}
        onFilterChange={onFilterChange}
        onSubmit={onSubmit}
        hashtagSuggestions={sampleSuggestions}
      />,
    );

    const preset100 = calculatePresetDates("100days");
    await screen.getByRole("button", { name: "直近100日" }).click();
    expect(onFilterChange).toHaveBeenCalledWith({
      ...baseFilter,
      startDate: preset100.startDate,
      endDate: preset100.endDate,
    });

    await screen.getByRole("button", { name: /#京都カフェ/ }).click();
    expect(onFilterChange).toHaveBeenCalledWith({
      ...baseFilter,
      hashtag: "京都カフェ",
    });

    await screen.getByRole("button", { name: "この条件で投稿を取得" }).click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("デモモード時にプリセット・チップ・取得ボタンを押しても変更されず警告バナーが表示・解除できること", async () => {
    const onFilterChange = vi.fn();
    const onSubmit = vi.fn();

    const screen = await render(
      <FeedFilterStep
        filter={{ ...baseFilter, hashtag: "100日チャレンジ" }}
        onFilterChange={onFilterChange}
        onSubmit={onSubmit}
        isDemoMode={true}
        hashtagSuggestions={sampleSuggestions}
      />,
    );

    const presetButton = screen.getByRole("button", { name: "直近30日" });
    await expect.element(presetButton).not.toBeDisabled();
    await presetButton.click();

    await expect.element(screen.getByText(/デモ体験中は条件を変更できません/)).toBeVisible();

    const dismissButton = screen.getByRole("button", { name: "案内を閉じる" });
    expect(dismissButton.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await dismissButton.click();
    await expect
      .element(screen.getByText(/デモ体験中は条件を変更できません/))
      .not.toBeInTheDocument();

    await screen.getByRole("button", { name: "この条件で投稿を取得" }).click();
    await expect.element(screen.getByText(/デモ体験中は条件を変更できません/)).toBeVisible();

    expect(onFilterChange).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("主要操作ボタンが 44px 以上のタップ領域を確保していること", async () => {
    const screen = await render(
      <FeedFilterStep
        filter={baseFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        fetchedCount={10}
      />,
    );

    const presetRect = screen
      .getByRole("button", { name: "直近100日" })
      .element()
      .getBoundingClientRect();
    const submitRect = screen
      .getByRole("button", { name: "この条件で投稿を取得" })
      .element()
      .getBoundingClientRect();
    const collapseRect = screen
      .getByRole("button", { name: "絞り込み条件を折りたたむ" })
      .element()
      .getBoundingClientRect();

    expect(presetRect.height).toBeGreaterThanOrEqual(44);
    expect(submitRect.height).toBeGreaterThanOrEqual(44);
    expect(collapseRect.height).toBeGreaterThanOrEqual(44);
  });

  it("取得済み件数があるとき内部状態で折りたたみと再展開を切り替えられること", async () => {
    const screen = await render(
      <FeedFilterStep
        filter={baseFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        fetchedCount={12}
      />,
    );

    await screen.getByRole("button", { name: "絞り込み条件を折りたたむ" }).click();
    await expect
      .element(screen.getByRole("region", { name: "フィード絞り込み条件サマリー" }))
      .toBeVisible();

    await screen.getByRole("button", { name: /絞り込み条件を展開/ }).click();
    await expect
      .element(screen.getByRole("region", { name: "フィード絞り込みフォーム" }))
      .toBeVisible();
  });
});
