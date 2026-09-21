/**
 * @file Unit tests for EPUB API route.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InstagramMedia } from "@/lib/instagram/types";

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    mkdtemp: vi.fn().mockResolvedValue("/tmp/epub-workdir"),
    readFile: vi.fn().mockResolvedValue(Buffer.from("epub")),
  };
});

vi.mock("@/lib/auth/session-service", () => ({
  resolveInstagramAccessToken: vi.fn().mockResolvedValue("token"),
}));

vi.mock("@/lib/instagram/graph-client", () => ({
  fetchGraphMedia: vi.fn().mockResolvedValue([
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
  ]),
}));

vi.mock("@/lib/instagram/filter-service", () => ({
  applyFeedFilter: vi.fn((items: InstagramMedia[]) => items),
}));

vi.mock("@/lib/epub/epub-builder", () => ({
  buildEpub: vi.fn().mockResolvedValue("/tmp/epub-workdir/instagram-feed.epub"),
}));

import { POST } from "./route";
import { buildEpub } from "@/lib/epub/epub-builder";

describe("POST /api/epub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses defaults for legacy payloads and forwards selected media IDs", async () => {
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
        },
        coverTheme: "navy",
        sortOrder: "desc",
      },
      "/tmp/epub-workdir",
    );
  });

  it("supports excludedMediaIds when selectedMediaIds is omitted", async () => {
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

  it("returns 400 for invalid coverTheme values", async () => {
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
          coverTheme: "orange",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "coverTheme の値が不正です" });
    expect(buildEpub).not.toHaveBeenCalled();
  });
});
