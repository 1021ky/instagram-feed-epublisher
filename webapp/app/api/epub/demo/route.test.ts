/**
 * @file デモ用EPUB生成APIルートの単体テスト。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    mkdtemp: vi.fn().mockResolvedValue("/tmp/epub-demo-workdir"),
    readFile: vi.fn().mockResolvedValue(Buffer.from("epub-demo")),
    rm: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/epub/epub-builder", () => ({
  buildEpub: vi.fn().mockResolvedValue("/tmp/epub-demo-workdir/instagram-feed-demo.epub"),
}));

import { POST } from "./route";
import { buildEpub } from "@/lib/epub/epub-builder";

describe("POST /api/epub/demo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
