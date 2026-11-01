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
});
