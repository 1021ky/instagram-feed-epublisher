/**
 * @file EPUB生成アプリケーションサービスの単体テスト。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InstagramMedia } from "@/lib/instagram/types";

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    mkdtemp: vi.fn(),
    readFile: vi.fn(),
    rm: vi.fn(),
  };
});

vi.mock("@/lib/epub/epub-builder", () => ({
  buildEpub: vi.fn(),
}));

vi.mock("@/lib/instagram/graph-client", () => ({
  fetchGraphMedia: vi.fn(),
}));

vi.mock("@/lib/instagram/filter-service", () => ({
  applyFeedFilter: vi.fn(),
}));

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { buildEpub } from "@/lib/epub/epub-builder";
import {
  generateFeedEpub,
  renderEpubToBuffer,
  selectMediaItems,
} from "@/lib/epub/epub-generation-service";
import { EpubRequestValidationError } from "@/lib/epub/epub-request.schema";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { fetchGraphMedia } from "@/lib/instagram/graph-client";

const samplePosts: InstagramMedia[] = [
  {
    id: "1",
    media_url: "https://example.com/1.jpg",
    permalink: "https://instagram.com/p/1",
    timestamp: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "2",
    media_url: "https://example.com/2.jpg",
    permalink: "https://instagram.com/p/2",
    timestamp: "2026-09-02T00:00:00.000Z",
  },
];

describe("投稿選択抽出 (selectMediaItems)", () => {
  it.each([
    {
      label: "両方未指定時は全件を返す",
      selectedMediaIds: undefined,
      excludedMediaIds: undefined,
      expectedIds: ["1", "2"],
    },
    {
      label: "selectedMediaIds 指定時は一致する投稿のみ返す",
      selectedMediaIds: ["2"],
      excludedMediaIds: undefined,
      expectedIds: ["2"],
    },
    {
      label: "excludedMediaIds 指定時は該当投稿を除外する",
      selectedMediaIds: undefined,
      excludedMediaIds: ["1"],
      expectedIds: ["2"],
    },
  ])("$label", ({ selectedMediaIds, excludedMediaIds, expectedIds }) => {
    const result = selectMediaItems(samplePosts, selectedMediaIds, excludedMediaIds);
    expect(result.map((item) => item.id)).toEqual(expectedIds);
  });
});

describe("一時ディレクトリ管理付き EPUB 生成 (renderEpubToBuffer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mkdtemp).mockResolvedValue("/tmp/epub-test-dir");
    vi.mocked(buildEpub).mockResolvedValue("/tmp/epub-test-dir/instagram-feed.epub");
    vi.mocked(readFile).mockResolvedValue(Buffer.from("epub-bytes"));
    vi.mocked(rm).mockResolvedValue(undefined);
  });

  it("正常終了時に EPUB Buffer を返し、一時ディレクトリを削除すること", async () => {
    const result = await renderEpubToBuffer(
      {
        items: samplePosts,
        metadata: {
          title: "Book",
          author: "Author",
          contact: "",
          instagramUrl: "",
        },
      },
      "epub-test-",
    );

    expect(result.toString()).toBe("epub-bytes");
    expect(rm).toHaveBeenCalledWith("/tmp/epub-test-dir", { recursive: true, force: true });
  });

  it("buildEpub が失敗した場合でも一時ディレクトリを確実に削除すること", async () => {
    vi.mocked(buildEpub).mockRejectedValueOnce(new Error("EPUB render error"));

    await expect(
      renderEpubToBuffer({
        items: samplePosts,
        metadata: {
          title: "Book",
          author: "Author",
          contact: "",
          instagramUrl: "",
        },
      }),
    ).rejects.toThrow("EPUB render error");

    expect(rm).toHaveBeenCalledWith("/tmp/epub-test-dir", { recursive: true, force: true });
  });
});

describe("フィードEPUB生成オーケストレーション (generateFeedEpub)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mkdtemp).mockResolvedValue("/tmp/epub-feed-dir");
    vi.mocked(buildEpub).mockResolvedValue("/tmp/epub-feed-dir/instagram-feed.epub");
    vi.mocked(readFile).mockResolvedValue(Buffer.from("epub-feed"));
    vi.mocked(rm).mockResolvedValue(undefined);
  });

  it("対象投稿が 0 件になった場合に EpubRequestValidationError を送出すること", async () => {
    vi.mocked(fetchGraphMedia).mockResolvedValueOnce(samplePosts);
    vi.mocked(applyFeedFilter).mockReturnValueOnce([]);

    await expect(
      generateFeedEpub({
        accessToken: "token",
        payload: {
          filter: { maxCount: 10 },
          metadata: {
            title: "Book",
            author: "",
            contact: "",
            instagramUrl: "",
            coverTheme: "navy",
          },
          coverTheme: "navy",
          sortOrder: "desc",
        },
      }),
    ).rejects.toThrow(EpubRequestValidationError);

    expect(buildEpub).not.toHaveBeenCalled();
  });
});
