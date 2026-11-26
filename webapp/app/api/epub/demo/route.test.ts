/**
 * @file デモ用EPUB生成APIルートの結合テスト。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";

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

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { POST } from "./route";
import { buildEpub } from "@/lib/epub/epub-builder";

describe("デモ用 EPUB 生成 API (POST /api/epub/demo)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mkdtemp).mockResolvedValue("/tmp/epub-demo-workdir");
    vi.mocked(readFile).mockResolvedValue(Buffer.from("epub-demo"));
    vi.mocked(rm).mockResolvedValue(undefined);
    vi.mocked(buildEpub).mockResolvedValue("/tmp/epub-demo-workdir/instagram-feed-demo.epub");
  });

  it("coverTheme と sortOrder が指定された場合、buildEpub に渡される", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          items: sampleDemoFeedData.posts.slice(0, 2),
          metadata: {
            title: "Demo Book",
            author: "@demo",
            contact: "demo@example.com",
            instagramUrl: "https://instagram.com/demo",
          },
          coverTheme: "purple",
          sortOrder: "asc",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        coverTheme: "purple",
        sortOrder: "asc",
        metadata: expect.objectContaining({
          title: "Demo Book",
          coverTheme: "purple",
        }),
      }),
      "/tmp/epub-demo-workdir",
    );
  });

  it("トップレベル未指定時は metadata.coverTheme および filter.sortOrder からフォールバックする", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10, sortOrder: "desc" },
          items: sampleDemoFeedData.posts.slice(0, 2),
          metadata: {
            title: "Demo Book",
            author: "@demo",
            contact: "demo@example.com",
            instagramUrl: "https://instagram.com/demo",
            coverTheme: "ivory",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        coverTheme: "ivory",
        sortOrder: "desc",
        metadata: expect.objectContaining({
          coverTheme: "ivory",
        }),
      }),
      "/tmp/epub-demo-workdir",
    );
  });

  it("未指定時はデフォルトテーマ navy が適用される", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          items: sampleDemoFeedData.posts.slice(0, 2),
          metadata: {
            title: "Demo Book",
            author: "@demo",
            contact: "demo@example.com",
            instagramUrl: "https://instagram.com/demo",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        coverTheme: "navy",
        sortOrder: "desc",
      }),
      "/tmp/epub-demo-workdir",
    );
  });

  it("itemsが未送信の場合はサンプルデータ全体にフォールバックして処理される", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: {
            title: "Demo Book",
            author: "@demo",
            contact: "demo@example.com",
            instagramUrl: "https://instagram.com/demo",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([sampleDemoFeedData.posts[0]]),
      }),
      "/tmp/epub-demo-workdir",
    );
  });

  it("許可されていないデモデータが送信された場合は HTTP 400 を返す", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          items: [
            {
              id: "unknown-demo-id",
              permalink: "https://instagram.com/p/unknown",
              timestamp: "2026-10-01T00:00:00.000Z",
              media_url: "https://example.com/unknown.jpg",
            },
          ],
          metadata: { title: "Demo Book" },
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "許可されていないデモデータです。" });
    expect(buildEpub).not.toHaveBeenCalled();
  });

  it("EPUB 生成中の予期せぬエラーでは HTTP 500 を返す", async () => {
    vi.mocked(buildEpub).mockRejectedValueOnce(new Error("Demo render failed"));

    const response = await POST(
      new Request("http://localhost/api/epub/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: { title: "Demo Book" },
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Demo render failed" });
    expect(rm).toHaveBeenCalledWith("/tmp/epub-demo-workdir", { recursive: true, force: true });
  });
});
