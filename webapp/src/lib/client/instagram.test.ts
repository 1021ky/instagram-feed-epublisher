/**
 * @file Unit tests for client API helpers.
 */
import { afterEach, expect, test, vi } from "vitest";
import { fetchInstagramFeed, requestEpub } from "@/lib/client/instagram";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

test("fetchInstagramFeed returns items on success", async () => {
  const response = {
    ok: true,
    json: async () => ({ items: [{ id: "1", media_url: "x", permalink: "p", timestamp: "t" }] }),
  } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  const items = await fetchInstagramFeed({ maxCount: 10 });
  expect(items).toHaveLength(1);
  expect(items[0]?.id).toBe("1");
});

test("fetchInstagramFeed throws on error", async () => {
  const response = {
    ok: false,
    status: 500,
    text: async () => "error message",
  } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  await expect(fetchInstagramFeed({ maxCount: 10 })).rejects.toThrow("フィード取得に失敗しました");
});

test("requestEpub returns blob on success", async () => {
  const blob = new Blob(["epub"]);
  const response = {
    ok: true,
    status: 200,
    blob: async () => blob,
    headers: new Headers({ "content-type": "application/epub+zip" }),
  } as unknown as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  const result = await requestEpub({
    filter: { maxCount: 1 },
    metadata: {
      title: "t",
      author: "a",
      contact: "c",
      instagramUrl: "u",
    },
  });
  expect(result).toBe(blob);
});

test("requestEpub throws on error", async () => {
  const response = {
    ok: false,
    status: 500,
    text: async () => "error message",
  } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  await expect(
    requestEpub({
      filter: { maxCount: 1 },
      metadata: {
        title: "t",
        author: "a",
        contact: "c",
        instagramUrl: "u",
      },
    })
  ).rejects.toThrow("EPUB生成に失敗しました");
});
