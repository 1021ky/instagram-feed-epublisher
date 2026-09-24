import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedFilterOptions, FeedPostItem } from "@/types/ui";
import {
  calculatePresetDates,
  detectPreset,
  FeedFilterStep,
  formatDateToISO,
} from "./FeedFilterStep";
import { formatPostDate, PostCard } from "./PostCard";
import { PostListStep } from "./PostListStep";
import { StickyActionBar } from "./StickyActionBar";

describe("FeedFilterStep ロジックおよび日付プリセット", () => {
  const baseDate = new Date("2026-09-21T00:00:00Z");

  it("formatDateToISO が YYYY-MM-DD 形式で正しく出力すること", () => {
    expect(formatDateToISO(baseDate)).toBe("2026-09-21");
  });

  it("直近100日プリセットが今日から100日前と今日を算出すること", () => {
    const dates = calculatePresetDates("100days", baseDate);
    expect(dates.endDate).toBe("2026-09-21");
    // 2026-09-21 の100日前は 2026-06-13
    expect(dates.startDate).toBe("2026-06-13");
  });

  it("直近30日プリセットが今日から30日前と今日を算出すること", () => {
    const dates = calculatePresetDates("30days", baseDate);
    expect(dates.endDate).toBe("2026-09-21");
    // 2026-09-21 の30日前は 2026-08-22
    expect(dates.startDate).toBe("2026-08-22");
  });

  it("全期間プリセットが開始日・終了日を未指定（undefined）にすること", () => {
    const dates = calculatePresetDates("all", baseDate);
    expect(dates.startDate).toBeUndefined();
    expect(dates.endDate).toBeUndefined();
  });

  it("detectPreset が設定値からプリセット種別を正確に判定すること", () => {
    expect(detectPreset(undefined, undefined, baseDate)).toBe("all");
    expect(detectPreset("2026-06-13", "2026-09-21", baseDate)).toBe("100days");
    expect(detectPreset("2026-08-22", "2026-09-21", baseDate)).toBe("30days");
    expect(detectPreset("2026-01-01", "2026-05-01", baseDate)).toBe("custom");
  });
});

describe("FeedFilterStep コンポーネント描画", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultFilter: FeedFilterOptions = {
    hashtag: "100日チャレンジ",
    startDate: "2026-06-13",
    endDate: "2026-09-21",
    maxCount: 200,
  };

  it("展開状態（デフォルト）で入力項目、期間プリセット、取得ボタンが描画されること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
      />,
    );

    // 見出し・入力項目
    expect(html).toContain("Step 1: フィードの絞り込み");
    expect(html).toContain("100日チャレンジ");
    expect(html).toContain("直近100日");
    expect(html).toContain("直近30日");
    expect(html).toContain("全期間");
    expect(html).toContain("最大200件");
    expect(html).toContain("この条件で投稿を取得");

    // タップ領域 44px 以上の確保クラスが含まれること
    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("min-h-[48px]");
  });

  it("折りたたみ状態（isCollapsed=true）でコンパクトなサマリーが表示されること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={true}
        fetchedCount={84}
      />,
    );

    expect(html).toContain("絞り込み条件");
    expect(html).toContain("#100日チャレンジ");
    expect(html).toContain("直近100日");
    expect(html).toContain("84件取得中");
    expect(html).toContain("条件を変更");
    // 展開用の大きなフォーム入力は含まれないこと
    expect(html).not.toContain("この条件で投稿を取得");
  });

  it("ローディング状態のとき取得中表示になること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={true}
        isCollapsed={false}
      />,
    );

    expect(html).toContain("投稿を取得中...");
    expect(html).toContain("disabled");
  });

  it("デモモード（isDemoMode=true）のとき、案内バナーが表示され入力がreadonlyになること", () => {
    const html = renderToStaticMarkup(
      <FeedFilterStep
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSubmit={vi.fn()}
        isCollapsed={false}
        isDemoMode={true}
      />,
    );

    expect(html).toContain(
      "デモ体験モード：条件は固定サンプルです（ログイン後に自由に変更できます）",
    );
    expect(html).toContain("readOnly");
    expect(html).toContain("cursor-not-allowed");
    expect(html).toContain("この条件で投稿を取得");
  });
});

describe("PostCard コンポーネント", () => {
  const samplePost: FeedPostItem = {
    id: "post-1",
    media_url: "https://example.com/photo.jpg",
    permalink: "https://instagram.com/p/sample123",
    timestamp: "2026-09-20T10:30:00Z",
    caption: "Day 99: 今日も1日やりきりました！ #100日チャレンジ",
    like_count: 125,
    selected: true,
  };

  it("formatPostDate が正しくフォーマットすること", () => {
    const formatted = formatPostDate("2026-09-20T10:30:00Z");
    // 日本語環境・UTC等による差異を許容しつつ年月日が含まれることを確認
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });

  it("収録対象（selected: true）のときチェックボックスがアクティブでいいね数が表示されること", () => {
    const html = renderToStaticMarkup(
      <PostCard post={samplePost} onToggleSelect={vi.fn()} index={1} />,
    );

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Day 99: 今日も1日やりきりました！");
    expect(html).toContain("125"); // いいね数
    expect(html).toContain("収録対象");
    expect(html).toContain("#1");
    expect(html).toContain("https://instagram.com/p/sample123");

    // タップ領域 44x44px (w-11 h-11) をチェックボックスに確保
    expect(html).toContain("w-11 h-11");
  });

  it("除外対象（selected: false）のとき非選択スタイルが適用されること", () => {
    const excludedPost: FeedPostItem = {
      ...samplePost,
      selected: false,
    };

    const html = renderToStaticMarkup(
      <PostCard post={excludedPost} onToggleSelect={vi.fn()} index={2} />,
    );

    expect(html).toContain('aria-checked="false"');
    expect(html).toContain("除外");
    expect(html).toContain("opacity-60");
  });

  it("キャプションが存在しない場合にフォールバック文言が表示されること", () => {
    const noCaptionPost: FeedPostItem = {
      ...samplePost,
      caption: undefined,
    };

    const html = renderToStaticMarkup(<PostCard post={noCaptionPost} onToggleSelect={vi.fn()} />);

    expect(html).toContain("(キャプションなし)");
  });
});

describe("PostListStep コンポーネント", () => {
  const samplePosts: FeedPostItem[] = [
    {
      id: "p1",
      media_url: "https://example.com/1.jpg",
      permalink: "https://instagram.com/p/1",
      timestamp: "2026-09-18T10:00:00Z",
      caption: "Day 98: 朝のランニング記録",
      like_count: 50,
      selected: true,
    },
    {
      id: "p2",
      media_url: "https://example.com/2.jpg",
      permalink: "https://instagram.com/p/2",
      timestamp: "2026-09-19T10:00:00Z",
      caption: "Day 99: カフェで読書",
      like_count: 75,
      selected: true,
    },
    {
      id: "p3",
      media_url: "https://example.com/3.jpg",
      permalink: "https://instagram.com/p/3",
      timestamp: "2026-09-20T10:00:00Z",
      caption: "Day 100: 祝・完走！",
      like_count: 200,
      selected: false,
    },
  ];

  it("選択件数が正確に集計・バッジ表示されること", () => {
    const html = renderToStaticMarkup(
      <PostListStep
        posts={samplePosts}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    // 3件中2件選択中
    expect(html).toContain("選択中: 2 / 3 件");
    expect(html).toContain("すべて選択");
    expect(html).toContain("選択解除");
    expect(html).toContain("Day 98: 朝のランニング記録");
    expect(html).toContain("Day 99: カフェで読書");
    expect(html).toContain("Day 100: 祝・完走！");

    // 固定バーと被らない余白が設定されていること
    expect(html).toContain("pb-28");
  });

  it("投稿が0件のときに親切な空状態（Empty State）が表示されること", () => {
    const html = renderToStaticMarkup(
      <PostListStep
        posts={[]}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    expect(html).toContain("投稿が見つかりませんでした");
    expect(html).toContain("選択中: 0 / 0 件");
  });

  it("フィード未取得（isFetched=false）のときに未取得案内が表示されること", () => {
    const html = renderToStaticMarkup(
      <PostListStep
        posts={[]}
        isFetched={false}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );

    expect(html).toContain("Step 2: 投稿の確認・選択");
    expect(html).toContain("未取得");
    expect(html).toContain("投稿はまだ取得されていません");
    expect(html).toContain("この条件で投稿を取得");
  });
});

describe("StickyActionBar コンポーネント", () => {
  it("最下部固定スタイル、Safe Area、選択件数、次へボタンが正しく描画されること", () => {
    const html = renderToStaticMarkup(
      <StickyActionBar
        selectedCount={42}
        totalCount={50}
        onNext={vi.fn()}
        nextLabel="本の設定に進む"
      />,
    );

    // 固定表示 & Safe Area
    expect(html).toContain("fixed bottom-0");
    expect(html).toContain("pb-safe");

    // 選択件数表示
    expect(html).toContain("42");
    expect(html).toContain("/ 50 件");
    expect(html).toContain("本の設定に進む");

    // タップ領域 48px
    expect(html).toContain("min-h-[48px]");
  });

  it("選択件数が0件のときに次へボタンが disabled になること", () => {
    const html = renderToStaticMarkup(<StickyActionBar selectedCount={0} onNext={vi.fn()} />);

    expect(html).toContain("disabled");
    expect(html).toContain("選択中:");
    expect(html).toContain("0");
  });

  it("onBack が指定された場合に戻るボタンが表示されること", () => {
    const html = renderToStaticMarkup(
      <StickyActionBar selectedCount={10} onNext={vi.fn()} onBack={vi.fn()} backLabel="前へ" />,
    );

    expect(html).toContain("前へ");
  });
});
