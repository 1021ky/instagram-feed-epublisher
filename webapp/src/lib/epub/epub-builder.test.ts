/**
 * @file EPUBビルダーの単体テスト。
 */
import { expect, test, vi, describe, beforeEach } from "vitest";
import {
  mockMediaBasic,
  mockMediaWithSpecialChars,
  mockMediaWithNewlines,
} from "@/__fixtures__/instagram-media";
import path from "path";
import type { InstagramMedia } from "@/lib/instagram/types";

// EPubクラスのrenderメソッドをspyとして保持
const mockRender = vi.fn().mockResolvedValue(undefined);
const capturedEpubOptions: Array<Record<string, unknown>> = [];
const capturedEpubOutputPaths: string[] = [];

vi.mock("@lesjoursfr/html-to-epub", () => ({
  EPub: class {
    constructor(options: Record<string, unknown>, outputPath: string) {
      capturedEpubOptions.push(options);
      capturedEpubOutputPaths.push(outputPath);
    }

    render(): Promise<void> {
      return mockRender();
    }
  },
}));

vi.mock("@/lib/epub/media-downloader", () => ({
  downloadMedia: vi.fn().mockResolvedValue("/tmp/1.jpg"),
}));

vi.mock("@/lib/epub/template-renderer", () => ({
  loadLayoutTemplate: vi.fn().mockResolvedValue({ layoutHtml: "x", cssContent: "y" }),
  renderChapterHtml: vi.fn().mockReturnValue("<html></html>"),
}));

vi.mock("@/lib/epub/cover-renderer", () => ({
  renderCoverJpg: vi.fn().mockResolvedValue("/tmp/cover.jpg"),
}));

import { buildEpub } from "./epub-builder";

const items = [
  {
    id: "1",
    media_url: "x",
    permalink: "p",
    timestamp: "t",
  },
];

describe("buildEpub", () => {
  // 各テスト前にモックの状態をリセット
  beforeEach(() => {
    vi.clearAllMocks();
    // mockRenderをデフォルトの成功状態に戻す
    mockRender.mockResolvedValue(undefined);
    capturedEpubOptions.length = 0;
    capturedEpubOutputPaths.length = 0;
  });

  test("出力パスを返す", async () => {
    const output = await buildEpub(
      {
        items,
        metadata: {
          title: "title",
          author: "author",
          contact: "contact",
          instagramUrl: "url",
        },
      },
      "/tmp",
    );
    expect(output).toBe("/tmp/instagram-feed.epub");
  });

  test("renderエラー時は例外を投げる", async () => {
    // このテストのためにrenderをエラーを投げるように設定
    mockRender.mockRejectedValue(new Error("render error"));

    await expect(
      buildEpub(
        {
          items,
          metadata: {
            title: "title",
            author: "author",
            contact: "contact",
            instagramUrl: "url",
          },
        },
        "/tmp",
      ),
    ).rejects.toThrow("render error");
  });

  test("フィクスチャを使用してEPUB生成フローをテスト", async () => {
    const { downloadMedia } = await import("@/lib/epub/media-downloader");
    const { renderChapterHtml } = await import("@/lib/epub/template-renderer");
    const { renderCoverJpg } = await import("@/lib/epub/cover-renderer");

    // テスト用のダミー画像パスを取得
    const fixtureImagePath = path.resolve(
      process.cwd(),
      "src/__fixtures__/images/feed_img_sample01.png",
    );

    // downloadMediaモックをダミー画像パスを返すように設定
    vi.mocked(downloadMedia).mockResolvedValue(fixtureImagePath);

    const epubInput = {
      items: [mockMediaBasic, mockMediaWithSpecialChars, mockMediaWithNewlines],
      metadata: {
        title: "Test EPUB with Fixtures",
        author: "Test Author",
        contact: "test@example.com",
        instagramUrl: "https://instagram.com/testuser",
        language: "ja",
      },
    };

    const outputPath = await buildEpub(epubInput, "/tmp");

    // buildEpubが正常に完了すること
    expect(outputPath).toBe("/tmp/instagram-feed.epub");

    // downloadMediaが各アイテムに対して呼ばれたことを確認
    expect(downloadMedia).toHaveBeenCalledTimes(3);

    // renderChapterHtmlが各アイテムに対して呼ばれたことを確認
    expect(renderChapterHtml).toHaveBeenCalledTimes(3);

    // renderCoverJpgが呼ばれたことを確認
    expect(renderCoverJpg).toHaveBeenCalledTimes(1);
  });

  test("選択された投稿のみを指定順で章に含める", async () => {
    const { downloadMedia } = await import("@/lib/epub/media-downloader");
    const { renderChapterHtml } = await import("@/lib/epub/template-renderer");
    const { renderCoverJpg } = await import("@/lib/epub/cover-renderer");

    const sortableItems: InstagramMedia[] = [
      {
        id: "newest",
        caption: "Newest",
        media_url: "x",
        permalink: "p1",
        timestamp: "2026-09-03T00:00:00.000Z",
      },
      {
        id: "oldest",
        caption: "Oldest",
        media_url: "y",
        permalink: "p2",
        timestamp: "2026-09-01T00:00:00.000Z",
      },
      {
        id: "middle",
        caption: "Middle",
        media_url: "z",
        permalink: "p3",
        timestamp: "2026-09-02T00:00:00.000Z",
      },
    ];

    await buildEpub(
      {
        items: sortableItems,
        metadata: {
          title: "title",
          author: "author",
          contact: "contact",
          instagramUrl: "url",
        },
        coverTheme: "purple",
        sortOrder: "asc",
        selectedMediaIds: ["middle", "oldest"],
      },
      "/tmp",
    );

    expect(downloadMedia).toHaveBeenNthCalledWith(1, sortableItems[1], "/tmp");
    expect(downloadMedia).toHaveBeenNthCalledWith(2, sortableItems[2], "/tmp");
    expect(downloadMedia).toHaveBeenCalledTimes(2);
    expect(renderChapterHtml).toHaveBeenCalledTimes(2);
    expect(renderCoverJpg).toHaveBeenCalledWith(
      {
        title: "title",
        author: "author",
        contact: "contact",
        instagramUrl: "url",
      },
      "/tmp",
      "purple",
    );
    expect(capturedEpubOptions[0]?.content).toEqual([
      { title: "Oldest", data: "<html></html>", filename: "oldest.xhtml" },
      { title: "Middle", data: "<html></html>", filename: "middle.xhtml" },
    ]);
    expect(capturedEpubOutputPaths[0]).toBe("/tmp/instagram-feed.epub");
  });

  test("不正なtimestampを持つ投稿は末尾に元順のまま配置する", async () => {
    const { downloadMedia } = await import("@/lib/epub/media-downloader");

    const mixedTimestampItems: InstagramMedia[] = [
      {
        id: "invalid-1",
        caption: "Invalid 1",
        media_url: "x",
        permalink: "p1",
        timestamp: "not-a-date",
      },
      {
        id: "valid-1",
        caption: "Valid 1",
        media_url: "y",
        permalink: "p2",
        timestamp: "2026-09-01T00:00:00.000Z",
      },
      {
        id: "valid-2",
        caption: "Valid 2",
        media_url: "z",
        permalink: "p3",
        timestamp: "2026-09-02T00:00:00.000Z",
      },
      {
        id: "invalid-2",
        caption: "Invalid 2",
        media_url: "w",
        permalink: "p4",
        timestamp: "still-not-a-date",
      },
    ];

    await buildEpub(
      {
        items: mixedTimestampItems,
        metadata: {
          title: "title",
          author: "author",
          contact: "contact",
          instagramUrl: "url",
        },
        sortOrder: "asc",
      },
      "/tmp",
    );

    expect(downloadMedia).toHaveBeenNthCalledWith(1, mixedTimestampItems[1], "/tmp");
    expect(downloadMedia).toHaveBeenNthCalledWith(2, mixedTimestampItems[2], "/tmp");
    expect(downloadMedia).toHaveBeenNthCalledWith(3, mixedTimestampItems[0], "/tmp");
    expect(downloadMedia).toHaveBeenNthCalledWith(4, mixedTimestampItems[3], "/tmp");
  });
});
