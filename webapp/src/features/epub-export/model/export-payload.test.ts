import { describe, expect, it } from "vitest";
import type { FeedFilter } from "@/lib/client/instagram";
import type { EpubCustomSettings, FeedPostItem } from "@/types/ui";
import {
  applyUsernameDefaultsToSettings,
  buildEpubExportPayload,
  createDemoEpubSettings,
  createInitialEpubSettings,
  DEFAULT_BOOK_TITLE,
  resolveExportFilename,
  resolveRecommendedBookTitle,
} from "./export-payload";

/** ペイロード組み立て検証で共通利用する正規化済みフィルター条件 */
const baseFilter: FeedFilter = {
  hashtag: "京都カフェ",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  maxCount: 100,
  sortOrder: "asc",
};

/** 並び替えやカルーセル子選択・UI専用フィールド除外を検証するための選択済み投稿サンプル */
const sampleSelectedPosts: FeedPostItem[] = [
  {
    id: "post-new",
    media_type: "CAROUSEL_ALBUM",
    media_url: "https://example.com/c1.jpg",
    permalink: "https://instagram.com/p/new",
    caption: "新しいカルーセル投稿",
    timestamp: "2026-09-20T10:00:00Z",
    like_count: 99,
    comments_count: 12,
    selected: true,
    selectedChildIds: ["c1", "c3"],
    children: {
      data: [
        { id: "c1", media_type: "IMAGE", media_url: "https://example.com/c1.jpg" },
        { id: "c2", media_type: "IMAGE", media_url: "https://example.com/c2.jpg" },
        { id: "c3", media_type: "IMAGE", media_url: "https://example.com/c3.jpg" },
      ],
    },
  },
  {
    id: "post-old",
    media_type: "IMAGE",
    media_url: "https://example.com/old.jpg",
    permalink: "https://instagram.com/p/old",
    caption: "古い単一投稿",
    timestamp: "2026-09-10T10:00:00Z",
    like_count: 42,
    selected: true,
  },
];

/** タイトル前後空白や未定義オプショナル項目を含む装丁設定サンプル */
const baseSettings: EpubCustomSettings = {
  title: "  旅の記録  ",
  subtitle: "2026 秋",
  author: "@alice",
  coverTheme: "slate",
  sortOrder: "asc",
  contact: undefined,
  instagramUrl: undefined,
};

describe("EPUB 装丁設定とペイロード組み立て (export-payload)", () => {
  it("初期設定とデモ設定がそれぞれ既定値で生成されること", () => {
    expect(createInitialEpubSettings()).toEqual({
      title: DEFAULT_BOOK_TITLE,
      subtitle: "",
      author: "",
      coverTheme: "navy",
      sortOrder: "asc",
      contact: "",
      instagramUrl: "",
    });

    expect(createDemoEpubSettings("demo_100days")).toEqual({
      title: "100日チャレンジの記録",
      subtitle: "100日チャレンジの振り返り",
      author: "@demo_100days",
      contact: "",
      instagramUrl: "https://www.instagram.com/demo_100days/",
      coverTheme: "navy",
      sortOrder: "asc",
    });
  });

  describe("推奨タイトルの解決 (resolveRecommendedBookTitle)", () => {
    it.each([
      { label: "ユーザー名あり", username: "alice", expected: "@aliceの投稿記録" },
      { label: "空文字", username: "", expected: DEFAULT_BOOK_TITLE },
    ])("$label の場合に $expected を返すこと", ({ username, expected }) => {
      expect(resolveRecommendedBookTitle(username)).toBe(expected);
    });
  });

  describe("ユーザー名の自動補完 (applyUsernameDefaultsToSettings)", () => {
    it.each([
      {
        label: "初期設定へログインユーザー名を補完する場合",
        current: createInitialEpubSettings(),
        username: "alice",
        expectSameRef: false,
        expected: {
          title: "@aliceの投稿記録",
          author: "@alice",
          instagramUrl: "https://instagram.com/alice",
        },
      },
      {
        label: "デモ設定済みでタイトル・著者・URL が入力済みの場合（上書きしない）",
        current: createDemoEpubSettings("demo_100days"),
        username: "demo_100days",
        expectSameRef: true,
        expected: {
          title: "100日チャレンジの記録",
          author: "@demo_100days",
          instagramUrl: "https://www.instagram.com/demo_100days/",
        },
      },
      {
        label: "ユーザーが独自タイトルを入力済みで著者と URL のみ空の場合",
        current: {
          ...createInitialEpubSettings(),
          title: "オリジナル写真集",
        },
        username: "bob",
        expectSameRef: false,
        expected: {
          title: "オリジナル写真集",
          author: "@bob",
          instagramUrl: "https://instagram.com/bob",
        },
      },
      {
        label: "ユーザー名が空で変更が不要な場合",
        current: createInitialEpubSettings(),
        username: "",
        expectSameRef: true,
        expected: {
          title: DEFAULT_BOOK_TITLE,
          author: "",
          instagramUrl: "",
        },
      },
    ])("$label に期待通り反映されること", ({ current, username, expectSameRef, expected }) => {
      const next = applyUsernameDefaultsToSettings(current, username);

      if (expectSameRef) {
        expect(next).toBe(current);
      } else {
        expect(next).not.toBe(current);
      }

      expect(next.title).toBe(expected.title);
      expect(next.author).toBe(expected.author);
      expect(next.instagramUrl).toBe(expected.instagramUrl);
    });
  });

  describe("ダウンロードファイル名の解決 (resolveExportFilename)", () => {
    it.each([
      { label: "デモモード", isDemoMode: true, expected: "instagram-feed-demo.epub" },
      { label: "通常ログインモード", isDemoMode: false, expected: "instagram-feed.epub" },
    ])("$label の場合に $expected を返すこと", ({ isDemoMode, expected }) => {
      expect(resolveExportFilename(isDemoMode)).toBe(expected);
    });
  });

  describe("EPUB リクエストペイロード組み立て (buildEpubExportPayload)", () => {
    it.each([
      {
        label: "デモモード・昇順 (asc)",
        isDemoMode: true,
        sortOrder: "asc" as const,
        expectedItemIds: ["post-old", "post-new"],
      },
      {
        label: "デモモード・降順 (desc)",
        isDemoMode: true,
        sortOrder: "desc" as const,
        expectedItemIds: ["post-new", "post-old"],
      },
      {
        label: "通常モード（items は未設定）",
        isDemoMode: false,
        sortOrder: "asc" as const,
        expectedItemIds: undefined,
      },
    ])(
      "$label の場合にタイトルのトリム・カルーセル選択・items 出力が期待通り組み立てられること",
      ({ isDemoMode, sortOrder, expectedItemIds }) => {
        const payload = buildEpubExportPayload({
          isDemoMode,
          filter: { ...baseFilter, sortOrder },
          settings: { ...baseSettings, sortOrder },
          selectedPosts: sampleSelectedPosts,
        });

        expect(payload.demoMode).toBe(isDemoMode);
        expect(payload.metadata).toEqual({
          title: "旅の記録",
          subtitle: "2026 秋",
          author: "@alice",
          contact: "",
          instagramUrl: "",
          coverTheme: "slate",
        });
        expect(payload.coverTheme).toBe("slate");
        expect(payload.sortOrder).toBe(sortOrder);
        expect(payload.selectedMediaIds).toEqual(["post-new", "post-old"]);
        expect(payload.selectedCarouselChildren).toEqual({
          "post-new": ["c1", "c3"],
        });

        if (expectedItemIds) {
          expect(payload.items?.map((item) => item.id)).toEqual(expectedItemIds);
          expect("like_count" in (payload.items?.[0] ?? {})).toBe(false);
          expect("selected" in (payload.items?.[0] ?? {})).toBe(false);
        } else {
          expect(payload.items).toBeUndefined();
        }
      },
    );

    it("カルーセル個別選択がない場合は selectedCarouselChildren プロパティを含めないこと", () => {
      const payload = buildEpubExportPayload({
        isDemoMode: false,
        filter: baseFilter,
        settings: baseSettings,
        selectedPosts: [sampleSelectedPosts[1]],
      });

      expect("selectedCarouselChildren" in payload).toBe(false);
    });
  });
});
