/**
 * @file Unit tests for Instagram Graph API client.
 */
import { afterEach, expect, test, vi } from "vitest";
import { fetchGraphMedia } from "./graph-client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

test("fetchGraphMedia returns data on success", async () => {
  const response = {
    ok: true,
    json: async () => ({ data: [{ id: "1", media_url: "x", permalink: "p", timestamp: "t" }] }),
  } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  const items = await fetchGraphMedia("token");
  expect(items).toHaveLength(1);
});

test("fetchGraphMedia throws on missing token", async () => {
  await expect(fetchGraphMedia("")).rejects.toThrow("アクセストークンがありません");
});

test("fetchGraphMedia throws on non-200 response", async () => {
  const response = { ok: false, status: 500 } as Response;
  globalThis.fetch = vi.fn().mockResolvedValue(response);

  await expect(fetchGraphMedia("token")).rejects.toThrow("Graph API error");
});
