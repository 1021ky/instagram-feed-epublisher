/**
 * @file Unit tests for EPUB builder.
 */
import { expect, test, vi, describe, beforeEach } from "vitest";
import {
  mockMediaBasic,
  mockMediaWithSpecialChars,
  mockMediaWithNewlines,
} from "@/__fixtures__/instagram-media";
import path from "path";

// EPubクラスのrenderメソッドをspyとして保持
const mockRender = vi.fn().mockResolvedValue(undefined);

vi.mock("@lesjoursfr/html-to-epub", () => ({
  EPub: class {
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
  });

  test("returns output path", async () => {
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
      "/tmp"
    );
    expect(output).toBe("/tmp/instagram-feed.epub");
  });

  test("throws on render error", async () => {
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
        "/tmp"
      )
    ).rejects.toThrow("render error");
  });

  test("フィクスチャを使用してEPUB生成フローをテスト", async () => {
    const { downloadMedia } = await import("@/lib/epub/media-downloader");
    const { renderChapterHtml } = await import("@/lib/epub/template-renderer");
    const { renderCoverJpg } = await import("@/lib/epub/cover-renderer");

    // テスト用のダミー画像パスを取得
    const fixtureImagePath = path.resolve(
      process.cwd(),
      "src/__fixtures__/images/feed_img_sample01.png"
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
});
