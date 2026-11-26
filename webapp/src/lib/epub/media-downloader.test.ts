/**
 * @file 投稿メディア画像ダウンローダーの単体テスト
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadMedia } from "./media-downloader";

const originalFetch = globalThis.fetch;

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("メディア画像のダウンロード保存 (downloadMedia)", () => {
  it("画像の取得に成功した場合にローカルファイルを書き出してパスを返す", async () => {
    const response = {
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("img").buffer,
    } as Response;
    globalThis.fetch = vi.fn().mockResolvedValue(response);

    const filePath = await downloadMedia(
      { id: "1", media_url: "http://example.com/x.jpg", permalink: "p", timestamp: "t" },
      "/tmp",
    );
    expect(filePath).toBe("/tmp/1.jpg");
  });

  it("画像の取得に失敗した場合にエラーを送出する", async () => {
    const response = { ok: false, status: 500 } as Response;
    globalThis.fetch = vi.fn().mockResolvedValue(response);

    await expect(
      downloadMedia(
        { id: "1", media_url: "http://example.com/x.jpg", permalink: "p", timestamp: "t" },
        "/tmp",
      ),
    ).rejects.toThrow("画像の取得に失敗しました");
  });

  it.each([
    {
      label: "動画投稿 (VIDEO) の thumbnail_url",
      item: {
        id: "v1",
        media_type: "VIDEO" as const,
        media_url: "http://example.com/video.mp4",
        thumbnail_url: "http://example.com/video-thumb.jpg",
        permalink: "p",
        timestamp: "t",
      },
      expectedFetchUrl: "http://example.com/video-thumb.jpg",
      expectedPath: "/tmp/v1.jpg",
    },
    {
      label: "カルーセル投稿 (CAROUSEL_ALBUM) の先頭画像",
      item: {
        id: "c1",
        media_type: "CAROUSEL_ALBUM" as const,
        permalink: "p",
        timestamp: "t",
        children: {
          data: [
            { id: "ch1", media_type: "IMAGE" as const, media_url: "http://example.com/ch1.jpg" },
            { id: "ch2", media_type: "IMAGE" as const, media_url: "http://example.com/ch2.jpg" },
          ],
        },
      },
      expectedFetchUrl: "http://example.com/ch1.jpg",
      expectedPath: "/tmp/c1.jpg",
    },
  ])("$label を解決してダウンロードすること", async ({ item, expectedFetchUrl, expectedPath }) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("img").buffer,
    } as Response);
    globalThis.fetch = fetchMock;

    const filePath = await downloadMedia(item, "/tmp");
    expect(fetchMock).toHaveBeenCalledWith(expectedFetchUrl);
    expect(filePath).toBe(expectedPath);
  });

  it("解決できる画像 URL が存在しない場合にエラーを送出する", async () => {
    await expect(
      downloadMedia(
        {
          id: "empty-1",
          media_type: "VIDEO",
          permalink: "p",
          timestamp: "t",
        },
        "/tmp",
      ),
    ).rejects.toThrow("画像のURLが見つかりません: empty-1");
  });
});
