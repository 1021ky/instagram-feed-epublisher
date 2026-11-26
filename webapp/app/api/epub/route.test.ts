/**
 * @file EPUB APIルートの結合テスト。
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

vi.mock("@/lib/auth/session-service", () => ({
  resolveInstagramAccessToken: vi.fn(),
}));

vi.mock("@/lib/instagram/graph-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/instagram/graph-client")>();
  return {
    ...actual,
    fetchGraphMedia: vi.fn(),
  };
});

vi.mock("@/lib/instagram/filter-service", () => ({
  applyFeedFilter: vi.fn(),
}));

vi.mock("@/lib/epub/epub-builder", () => ({
  buildEpub: vi.fn(),
}));

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { POST } from "./route";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { buildEpub } from "@/lib/epub/epub-builder";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { fetchGraphMedia, InstagramGraphApiError } from "@/lib/instagram/graph-client";

const mockItems: InstagramMedia[] = [
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

describe("EPUB 生成 API (POST /api/epub)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mkdtemp).mockResolvedValue("/tmp/epub-workdir");
    vi.mocked(readFile).mockResolvedValue(Buffer.from("epub"));
    vi.mocked(rm).mockResolvedValue(undefined);
    vi.mocked(resolveInstagramAccessToken).mockResolvedValue("token");
    vi.mocked(fetchGraphMedia).mockResolvedValue(mockItems);
    vi.mocked(applyFeedFilter).mockImplementation((items: InstagramMedia[]) => items);
    vi.mocked(buildEpub).mockResolvedValue("/tmp/epub-workdir/instagram-feed.epub");
  });

  it("従来ペイロードではデフォルト値を補い、選択投稿のみを渡す", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: {
            title: "My Book",
            author: "Author",
            contact: "contact@example.com",
            instagramUrl: "https://instagram.com/example",
          },
          selectedMediaIds: ["2"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/epub+zip");
    expect(response.headers.get("Content-Disposition")).toBe(
      "attachment; filename=instagram-feed.epub",
    );
    expect(buildEpub).toHaveBeenCalledWith(
      {
        items: [
          {
            id: "2",
            media_url: "https://example.com/2.jpg",
            permalink: "https://instagram.com/p/2",
            timestamp: "2026-09-02T00:00:00.000Z",
          },
        ],
        metadata: {
          title: "My Book",
          author: "Author",
          contact: "contact@example.com",
          instagramUrl: "https://instagram.com/example",
          language: undefined,
          coverTheme: "navy",
        },
        coverTheme: "navy",
        sortOrder: "desc",
      },
      "/tmp/epub-workdir",
    );
  });

  it("トップレベル未指定時にmetadata.coverThemeおよびfilter.sortOrderからフォールバック解決する", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10, sortOrder: "asc" },
          metadata: {
            title: "My Book",
            author: "Author",
            contact: "contact@example.com",
            instagramUrl: "https://instagram.com/example",
            coverTheme: "slate",
          },
          selectedMediaIds: ["1"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        coverTheme: "slate",
        sortOrder: "asc",
        metadata: expect.objectContaining({
          coverTheme: "slate",
        }),
      }),
      "/tmp/epub-workdir",
    );
  });

  it("selectedMediaIds未指定時はexcludedMediaIdsで除外できる", async () => {
    await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: {
            title: "My Book",
            author: "Author",
            contact: "contact@example.com",
            instagramUrl: "https://instagram.com/example",
          },
          coverTheme: "ivory",
          sortOrder: "asc",
          excludedMediaIds: ["1"],
        }),
      }),
    );

    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            id: "2",
            media_url: "https://example.com/2.jpg",
            permalink: "https://instagram.com/p/2",
            timestamp: "2026-09-02T00:00:00.000Z",
          },
        ],
        coverTheme: "ivory",
        sortOrder: "asc",
      }),
      "/tmp/epub-workdir",
    );
  });

  it.each([
    {
      label: "不正な coverTheme",
      body: {
        filter: { maxCount: 10 },
        metadata: {
          title: "My Book",
          author: "Author",
          contact: "contact@example.com",
          instagramUrl: "https://instagram.com/example",
        },
        coverTheme: "orange",
      },
      expectedError: "coverTheme の値が不正です",
    },
    {
      label: "selectedMediaIds と excludedMediaIds の同時指定",
      body: {
        filter: { maxCount: 10 },
        metadata: {
          title: "My Book",
          author: "Author",
          contact: "contact@example.com",
          instagramUrl: "https://instagram.com/example",
        },
        selectedMediaIds: ["1"],
        excludedMediaIds: ["2"],
      },
      expectedError: "selectedMediaIds と excludedMediaIds を同時に指定することはできません",
    },
    {
      label: "metadata.title が空文字",
      body: {
        filter: { maxCount: 10 },
        metadata: {
          title: "",
          author: "Author",
        },
      },
      expectedError: "書籍タイトルを入力してください",
    },
  ])("バリデーションエラー ($label) では 400 を返す", async ({ body, expectedError }) => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: expectedError });
    expect(buildEpub).not.toHaveBeenCalled();
  });

  it("不正な JSON 文字列のリクエストでは 400 を返す", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{invalid-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(buildEpub).not.toHaveBeenCalled();
  });

  it("nullや空配列の選択リストは未指定として扱う", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: {
            title: "My Book",
            author: "Author",
            contact: "contact@example.com",
            instagramUrl: "https://instagram.com/example",
          },
          selectedMediaIds: null,
          excludedMediaIds: [],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        items: mockItems,
      }),
      "/tmp/epub-workdir",
    );
  });

  it("fetchGraphMediaにフィルタ条件（期間・ハッシュタグ・件数）を引き渡す", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            hashtag: "100days",
            startDate: "2026-09-01",
            endDate: "2026-10-20",
            maxCount: 200,
          },
          metadata: {
            title: "My Book",
            author: "Author",
            contact: "contact@example.com",
            instagramUrl: "https://instagram.com/example",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchGraphMedia).toHaveBeenCalledWith("token", {
      filter: {
        hashtag: "100days",
        startDate: "2026-09-01",
        endDate: "2026-10-20",
        maxCount: 200,
      },
    });
  });

  it("selectedCarouselChildrenを指定した場合にbuildEpubへ引き渡される", async () => {
    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: {
            title: "My Book",
            author: "Author",
            contact: "contact@example.com",
            instagramUrl: "https://instagram.com/example",
          },
          selectedMediaIds: ["1"],
          selectedCarouselChildren: {
            "1": ["child-1", "child-3"],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedCarouselChildren: {
          "1": ["child-1", "child-3"],
        },
      }),
      "/tmp/epub-workdir",
    );
  });

  it("未ログイン時は HTTP 401 を返す", async () => {
    vi.mocked(resolveInstagramAccessToken).mockRejectedValueOnce(new Error("未ログインです"));

    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: { title: "My Book" },
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "未ログインです" });
  });

  it.each([
    { label: "認証失効 (auth)", kind: "auth" as const, upstreamStatus: 400, expectedStatus: 401 },
    {
      label: "レート制限 (rate_limit)",
      kind: "rate_limit" as const,
      upstreamStatus: 429,
      expectedStatus: 429,
    },
    {
      label: "上流障害 (upstream)",
      kind: "upstream" as const,
      upstreamStatus: 502,
      expectedStatus: 502,
    },
    {
      label: "タイムアウト (timeout)",
      kind: "timeout" as const,
      upstreamStatus: 504,
      expectedStatus: 504,
    },
  ])(
    "InstagramGraphApiError ($label) 発生時に推奨 HTTP ステータス $expectedStatus を返す",
    async ({ kind, upstreamStatus, expectedStatus }) => {
      vi.mocked(fetchGraphMedia).mockRejectedValueOnce(
        new InstagramGraphApiError({
          message: `Graph failure: ${kind}`,
          status: upstreamStatus,
          kind,
        }),
      );

      const response = await POST(
        new Request("http://localhost/api/epub", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filter: { maxCount: 10 },
            metadata: { title: "My Book" },
          }),
        }),
      );

      expect(response.status).toBe(expectedStatus);
      await expect(response.json()).resolves.toEqual({ error: `Graph failure: ${kind}` });
    },
  );

  it("EPUB 生成中の予期せぬエラーでは HTTP 500 を返す", async () => {
    vi.mocked(buildEpub).mockRejectedValueOnce(new Error("Disk full"));

    const response = await POST(
      new Request("http://localhost/api/epub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: { maxCount: 10 },
          metadata: { title: "My Book" },
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Disk full" });
    expect(rm).toHaveBeenCalledWith("/tmp/epub-workdir", { recursive: true, force: true });
  });
});
