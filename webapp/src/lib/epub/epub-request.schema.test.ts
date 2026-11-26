/**
 * @file EPUB生成リクエストスキーマと入力正規化パーサーの単体テスト。
 */
import { describe, expect, it } from "vitest";
import {
  EpubRequestValidationError,
  parseEpubDemoRequestPayload,
  parseEpubRequestPayload,
  validateEpubTitle,
} from "@/lib/epub/epub-request.schema";

const validMetadata = {
  title: "My Book",
  author: "Author",
  contact: "contact@example.com",
  instagramUrl: "https://instagram.com/example",
};

describe("EPUB書籍タイトルの入力検証 (validateEpubTitle)", () => {
  it.each([
    { label: "通常タイトル", title: "100日チャレンジの記録", expected: null },
    { label: "前後空白ありの有効タイトル", title: "  My Book  ", expected: null },
    { label: "空文字", title: "", expected: "書籍タイトルを入力してください" },
    { label: "半角スペースのみ", title: "   ", expected: "書籍タイトルを入力してください" },
    {
      label: "全角スペース・タブのみ",
      title: "　\t\n",
      expected: "書籍タイトルを入力してください",
    },
  ])("タイトルが $label の場合に期待通りの検証結果を返すこと", ({ title, expected }) => {
    expect(validateEpubTitle(title)).toBe(expected);
  });
});

describe("EPUB生成リクエストの正規化パーサー (parseEpubRequestPayload)", () => {
  it("有効な最小ペイロードでデフォルトテーマ・並び順を補完し、配列を重複排除すること", () => {
    const parsed = parseEpubRequestPayload({
      filter: { maxCount: 25, hashtag: "", startDate: "" },
      metadata: {
        title: "  旅行記  ",
      },
      selectedMediaIds: ["1", "1", "2"],
      selectedCarouselChildren: {
        "1": ["c1", "c1", "c2"],
      },
    });

    expect(parsed).toEqual({
      filter: {
        hashtag: undefined,
        startDate: undefined,
        endDate: undefined,
        maxCount: 25,
      },
      metadata: {
        title: "旅行記",
        author: "",
        contact: "",
        instagramUrl: "",
        language: undefined,
        coverTheme: "navy",
      },
      coverTheme: "navy",
      sortOrder: "desc",
      selectedMediaIds: ["1", "2"],
      excludedMediaIds: undefined,
      selectedCarouselChildren: {
        "1": ["c1", "c2"],
      },
    });
  });

  it("metadata.author / contact / instagramUrl に空文字が渡された場合も許容すること", () => {
    const parsed = parseEpubRequestPayload({
      filter: { maxCount: 10 },
      metadata: {
        title: "My Book",
        author: "",
        contact: "",
        instagramUrl: "",
      },
    });

    expect(parsed.metadata).toEqual({
      title: "My Book",
      author: "",
      contact: "",
      instagramUrl: "",
      language: undefined,
      coverTheme: "navy",
    });
  });

  it("トップレベル未指定時は metadata.coverTheme と filter.sortOrder へフォールバックすること", () => {
    const parsed = parseEpubRequestPayload({
      filter: { maxCount: 10, sortOrder: "asc" },
      metadata: {
        ...validMetadata,
        coverTheme: "ivory",
      },
    });

    expect(parsed.coverTheme).toBe("ivory");
    expect(parsed.sortOrder).toBe("asc");
    expect(parsed.metadata.coverTheme).toBe("ivory");
  });

  it.each([
    {
      label: "リクエスト本体が null",
      raw: null,
      expectedMessage: "EPUB生成リクエストの形式が不正です",
    },
    {
      label: "filter.maxCount が 0",
      raw: { filter: { maxCount: 0 }, metadata: validMetadata },
      expectedMessage: "filter.maxCount は 1 以上の数値で指定してください",
    },
    {
      label: "filter.maxCount が文字列",
      raw: { filter: { maxCount: "10" }, metadata: validMetadata },
      expectedMessage: "filter.maxCount は 1 以上の数値で指定してください",
    },
    {
      label: "metadata.title が空文字",
      raw: { filter: { maxCount: 10 }, metadata: { ...validMetadata, title: "" } },
      expectedMessage: "書籍タイトルを入力してください",
    },
    {
      label: "metadata.title が空白のみ",
      raw: { filter: { maxCount: 10 }, metadata: { ...validMetadata, title: "   " } },
      expectedMessage: "書籍タイトルを入力してください",
    },
    {
      label: "不正な coverTheme",
      raw: { filter: { maxCount: 10 }, metadata: validMetadata, coverTheme: "orange" },
      expectedMessage: "coverTheme の値が不正です",
    },
    {
      label: "不正な sortOrder",
      raw: { filter: { maxCount: 10 }, metadata: validMetadata, sortOrder: "random" },
      expectedMessage: "sortOrder の値が不正です",
    },
    {
      label: "selectedMediaIds と excludedMediaIds の同時指定",
      raw: {
        filter: { maxCount: 10 },
        metadata: validMetadata,
        selectedMediaIds: ["1"],
        excludedMediaIds: ["2"],
      },
      expectedMessage: "selectedMediaIds と excludedMediaIds を同時に指定することはできません",
    },
  ])(
    "不正入力 ($label) で EpubRequestValidationError を送出すること",
    ({ raw, expectedMessage }) => {
      expect(() => parseEpubRequestPayload(raw)).toThrow(EpubRequestValidationError);
      expect(() => parseEpubRequestPayload(raw)).toThrow(expectedMessage);
    },
  );
});

describe("デモ用EPUB生成リクエストの正規化パーサー (parseEpubDemoRequestPayload)", () => {
  it("デモ投稿配列とオプション指定を正しく正規化すること", () => {
    const parsed = parseEpubDemoRequestPayload({
      filter: { maxCount: 5, sortOrder: "asc" },
      metadata: { title: "Demo Book", coverTheme: "purple" },
      items: [
        {
          id: "demo-1",
          permalink: "https://instagram.com/p/demo-1",
          timestamp: "2026-10-01T00:00:00Z",
          media_type: "IMAGE",
          media_url: "https://example.com/demo-1.jpg",
        },
      ],
    });

    expect(parsed.coverTheme).toBe("purple");
    expect(parsed.sortOrder).toBe("asc");
    expect(parsed.items).toHaveLength(1);
    expect(parsed.metadata.contact).toBe("");
  });
});
