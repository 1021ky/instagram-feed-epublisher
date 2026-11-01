/**
 * @file クライアントAPIヘルパーの単体テスト
 */
import { afterEach, expect, test, vi } from "vitest";
import { fetchHashtagSuggestions, fetchInstagramFeed, requestEpub } from "@/lib/client/instagram";

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

test("fetchHashtagSuggestions returns hashtags on success", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      hashtags: [
        { tag: "100日チャレンジ", count: 12, lastUsedAt: "2026-10-20T09:00:00.000Z" },
        { tag: "京都カフェ", count: 5, lastUsedAt: "2026-10-18T09:00:00.000Z" },
      ],
      scannedPosts: 50,
    }),
  } as Response);
  globalThis.fetch = fetchMock;

  const suggestions = await fetchHashtagSuggestions(15);
  expect(suggestions).toHaveLength(2);
  expect(suggestions[0]).toEqual({
    tag: "100日チャレンジ",
    count: 12,
    lastUsedAt: "2026-10-20T09:00:00.000Z",
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/instagram/hashtags?limit=15",
    expect.objectContaining({ credentials: "include" }),
  );
});

test("fetchHashtagSuggestions throws descriptive error on failure", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 502,
    text: async () => JSON.stringify({ error: "Upstream unavailable" }),
  } as Response);

  await expect(fetchHashtagSuggestions()).rejects.toThrow(
    "ハッシュタグ候補の取得に失敗しました: 502 - Upstream unavailable",
  );
});

test("fetchHashtagSuggestions uses default limit=20 and falls back to empty array when hashtags key is omitted", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ scannedPosts: 0 }),
  } as Response);
  globalThis.fetch = fetchMock;

  const suggestions = await fetchHashtagSuggestions();
  expect(suggestions).toEqual([]);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/instagram/hashtags?limit=20",
    expect.objectContaining({ credentials: "include" }),
  );
});

test("fetchHashtagSuggestions preserves raw response text when error body is non-JSON or lacks error field", async () => {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => "Bad Gateway",
    } as Response)
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ detail: "unexpected" }),
    } as Response);

  await expect(fetchHashtagSuggestions()).rejects.toThrow(
    "ハッシュタグ候補の取得に失敗しました: 502 - Bad Gateway",
  );
  await expect(fetchHashtagSuggestions()).rejects.toThrow(
    'ハッシュタグ候補の取得に失敗しました: 500 - {"detail":"unexpected"}',
  );
});

test("requestEpub returns blob on success", async () => {
  const blob = new Blob(["epub"]);
  const response = {
    ok: true,
    status: 200,
    blob: async () => blob,
    headers: new Headers({ "content-type": "application/epub+zip" }),
  } as unknown as Response;
  const fetchMock = vi.fn().mockResolvedValue(response);
  globalThis.fetch = fetchMock;

  const request = {
    filter: { maxCount: 1 },
    metadata: {
      title: "t",
      subtitle: "s",
      author: "a",
      contact: "c",
      instagramUrl: "u",
      coverTheme: "purple" as const,
    },
  };
  const result = await requestEpub(request);
  expect(result).toBe(blob);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/epub",
    expect.objectContaining({ body: JSON.stringify(request) }),
  );
});

test("requestEpub sends coverTheme and sortOrder to /api/epub/demo in demoMode", async () => {
  const blob = new Blob(["demo-epub"]);
  const response = {
    ok: true,
    status: 200,
    blob: async () => blob,
    headers: new Headers({ "content-type": "application/epub+zip" }),
  } as unknown as Response;
  const fetchMock = vi.fn().mockResolvedValue(response);
  globalThis.fetch = fetchMock;

  const request = {
    demoMode: true,
    filter: { maxCount: 5 },
    metadata: {
      title: "Demo",
      author: "@demo",
      contact: "demo@example.com",
      instagramUrl: "https://instagram.com/demo",
      coverTheme: "ivory" as const,
    },
    coverTheme: "ivory" as const,
    sortOrder: "asc" as const,
  };
  const result = await requestEpub(request);
  expect(result).toBe(blob);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/epub/demo",
    expect.objectContaining({ body: JSON.stringify(request) }),
  );
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
    }),
  ).rejects.toThrow("EPUB生成に失敗しました");
});
