import { describe, expect, it } from "vitest";
import type { FeedPostItem } from "@/types/ui";
import {
  countSelectedPosts,
  deselectAllPosts,
  filterPostsByCaptionQuery,
  getSelectedPosts,
  isPostSelected,
  selectAllPosts,
  toggleCarouselChildSelection,
  togglePostSelection,
} from "./selection";

/**
 * 単一画像投稿のテストデータを生成します。
 */
function createSinglePost(overrides: Partial<FeedPostItem> = {}): FeedPostItem {
  return {
    id: "post-1",
    media_type: "IMAGE",
    media_url: "https://example.com/1.jpg",
    permalink: "https://instagram.com/p/post-1",
    timestamp: "2026-09-18T10:00:00Z",
    caption: "朝のランニング記録 #100日チャレンジ",
    selected: true,
    ...overrides,
  };
}

/**
 * カルーセル投稿のテストデータを生成します。
 */
function createCarouselPost(overrides: Partial<FeedPostItem> = {}): FeedPostItem {
  return {
    id: "carousel-1",
    media_type: "CAROUSEL_ALBUM",
    media_url: "https://example.com/c1.jpg",
    permalink: "https://instagram.com/p/carousel-1",
    timestamp: "2026-09-19T10:00:00Z",
    caption: "カフェ巡りの写真集",
    selected: true,
    children: {
      data: [
        { id: "c1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
        { id: "c2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
        { id: "c3", media_type: "IMAGE", media_url: "https://example.com/c3.jpg" },
      ],
    },
    ...overrides,
  };
}

describe("投稿選択判定・集計 (isPostSelected / getSelectedPosts / countSelectedPosts)", () => {
  it.each([
    { label: "selected が true の投稿", selected: true, expected: true },
    { label: "selected が未指定 (undefined) の投稿", selected: undefined, expected: true },
    { label: "selected が false の投稿", selected: false, expected: false },
  ])("$label の選択判定が $expected となること", ({ selected, expected }) => {
    const post = createSinglePost({ selected });
    expect(isPostSelected(post)).toBe(expected);
  });

  it("選択中投稿のみを抽出し件数を集計すること", () => {
    const posts = [
      createSinglePost({ id: "p1", selected: true }),
      createSinglePost({ id: "p2", selected: false }),
      createSinglePost({ id: "p3", selected: undefined }),
    ];

    expect(getSelectedPosts(posts).map((post) => post.id)).toEqual(["p1", "p3"]);
    expect(countSelectedPosts(posts)).toBe(2);
  });
});

describe("キャプションキーワード絞り込み (filterPostsByCaptionQuery)", () => {
  /** 英字・日本語・キャプション未設定の3パターンを網羅する検索テスト用投稿データ */
  const posts = [
    createSinglePost({ id: "p1", caption: "Day 1: Kyoto Coffee" }),
    createSinglePost({ id: "p2", caption: "Day 2: 鴨川さんぽ" }),
    createSinglePost({ id: "p3", caption: undefined }),
  ];

  it.each([
    { label: "空文字", query: "", expectedIds: ["p1", "p2", "p3"] },
    { label: "空白のみ", query: "   ", expectedIds: ["p1", "p2", "p3"] },
    { label: "大文字小文字を無視した英語一致", query: "  kyoto  ", expectedIds: ["p1"] },
    { label: "日本語部分一致", query: "鴨川", expectedIds: ["p2"] },
    { label: "一致なし", query: "存在しない語句", expectedIds: [] },
  ])("クエリが $label の場合に期待する投稿のみ返すこと", ({ query, expectedIds }) => {
    const result = filterPostsByCaptionQuery(posts, query);
    expect(result.map((post) => post.id)).toEqual(expectedIds);
  });
});

describe("単一投稿の選択トグル (togglePostSelection)", () => {
  it.each([
    {
      label: "選択中投稿を除外へ切り替える",
      initial: createSinglePost({ id: "p1", selected: true }),
      expectedSelected: false,
      expectedChildIds: undefined,
    },
    {
      label: "selected 未指定投稿を除外へ切り替える",
      initial: createSinglePost({ id: "p1", selected: undefined }),
      expectedSelected: false,
      expectedChildIds: undefined,
    },
    {
      label: "除外中投稿を選択へ戻す",
      initial: createSinglePost({ id: "p1", selected: false }),
      expectedSelected: true,
      expectedChildIds: undefined,
    },
    {
      label: "子画像全解除で除外されたカルーセルを再選択すると全子画像選択へ復帰する",
      initial: createCarouselPost({ id: "p1", selected: false, selectedChildIds: [] }),
      expectedSelected: true,
      expectedChildIds: undefined,
    },
    {
      label: "部分選択済みカルーセルを除外→再選択しても部分選択 ID を保持する",
      initial: createCarouselPost({ id: "p1", selected: false, selectedChildIds: ["c2"] }),
      expectedSelected: true,
      expectedChildIds: ["c2"],
    },
  ])("$label こと", ({ initial, expectedSelected, expectedChildIds }) => {
    const untouched = createSinglePost({ id: "other", selected: true });
    const [updated, other] = togglePostSelection([initial, untouched], "p1");

    expect(updated.selected).toBe(expectedSelected);
    expect(updated.selectedChildIds).toEqual(expectedChildIds);
    expect(other).toBe(untouched);
  });
});

describe("カルーセル個別写真の選択トグル (toggleCarouselChildSelection)", () => {
  it.each([
    {
      label: "全選択状態から 1 枚目を外すと残り 2 枚が選択される",
      initial: createCarouselPost({ selected: true, selectedChildIds: undefined }),
      targetChildId: "c1",
      expectedSelected: true,
      expectedChildIds: ["c2", "c3"],
    },
    {
      label: "残り 1 枚を外すと親投稿ごと未選択・selectedChildIds 空配列になる",
      initial: createCarouselPost({ selected: true, selectedChildIds: ["c2"] }),
      targetChildId: "c2",
      expectedSelected: false,
      expectedChildIds: [],
    },
    {
      label: "部分選択から欠けていた 1 枚を追加して全枚数揃うと undefined に正規化される",
      initial: createCarouselPost({ selected: true, selectedChildIds: ["c1", "c3"] }),
      targetChildId: "c2",
      expectedSelected: true,
      expectedChildIds: undefined,
    },
    {
      label: "親除外・子画像未指定の状態で 2 枚目を選ぶと親が選択され 2 枚目のみ有効になる",
      initial: createCarouselPost({ selected: false, selectedChildIds: undefined }),
      targetChildId: "c2",
      expectedSelected: true,
      expectedChildIds: ["c2"],
    },
    {
      label: "親除外・子画像空配列の状態で 1 枚目を選ぶと親が選択され 1 枚目のみ有効になる",
      initial: createCarouselPost({ selected: false, selectedChildIds: [] }),
      targetChildId: "c1",
      expectedSelected: true,
      expectedChildIds: ["c1"],
    },
  ])("$label こと", ({ initial, targetChildId, expectedSelected, expectedChildIds }) => {
    const [updated] = toggleCarouselChildSelection([initial], initial.id, targetChildId);

    expect(updated.selected).toBe(expectedSelected);
    expect(updated.selectedChildIds).toEqual(expectedChildIds);
  });

  it.each([
    {
      label: "カルーセルではない通常画像投稿",
      post: createSinglePost({ id: "single-1", selected: true }),
      childId: "c1",
    },
    {
      label: "存在しない子画像 ID 指定",
      post: createCarouselPost({ id: "carousel-1", selected: true, selectedChildIds: ["c1"] }),
      childId: "unknown-child",
    },
  ])("$label の場合は元の投稿オブジェクトを変更しないこと", ({ post, childId }) => {
    const [result] = toggleCarouselChildSelection([post], post.id, childId);
    expect(result).toBe(post);
  });
});

describe("一括選択・一括解除 (selectAllPosts / deselectAllPosts)", () => {
  it("selectAllPosts が全投稿を選択状態にし、空の selectedChildIds を全選択へ復帰させること", () => {
    const posts = [
      createSinglePost({ id: "p1", selected: false }),
      createCarouselPost({ id: "p2", selected: false, selectedChildIds: [] }),
      createCarouselPost({ id: "p3", selected: false, selectedChildIds: ["c2"] }),
    ];

    const updated = selectAllPosts(posts);

    expect(updated.map((post) => post.selected)).toEqual([true, true, true]);
    expect(updated[1].selectedChildIds).toBeUndefined();
    expect(updated[2].selectedChildIds).toEqual(["c2"]);
  });

  it("deselectAllPosts が全投稿を未選択状態にし、既存の部分選択 ID は保持すること", () => {
    const posts = [
      createSinglePost({ id: "p1", selected: true }),
      createCarouselPost({ id: "p2", selected: true, selectedChildIds: ["c1", "c3"] }),
    ];

    const updated = deselectAllPosts(posts);

    expect(updated.map((post) => post.selected)).toEqual([false, false]);
    expect(updated[1].selectedChildIds).toEqual(["c1", "c3"]);
  });
});
