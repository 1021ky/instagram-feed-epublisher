/**
 * @file Unit tests for media downloader.
 */
import { afterEach, expect, test, vi } from "vitest";
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

test("downloadMedia writes file on success", async () => {
  const response = {
    ok: true,
    arrayBuffer: async () => new TextEncoder().encode("img").buffer,
  } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  const filePath = await downloadMedia(
    { id: "1", media_url: "http://example.com/x.jpg", permalink: "p", timestamp: "t" },
    "/tmp"
  );
  expect(filePath).toBe("/tmp/1.jpg");
});

test("downloadMedia throws on fetch error", async () => {
  const response = { ok: false, status: 500 } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  await expect(
    downloadMedia(
      { id: "1", media_url: "http://example.com/x.jpg", permalink: "p", timestamp: "t" },
      "/tmp"
    )
  ).rejects.toThrow("画像の取得に失敗しました");
});
