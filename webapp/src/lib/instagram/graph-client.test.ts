/**
 * @file Unit tests for Instagram `/me/media` client (`graph-client.ts`).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateMaxLookbackMs,
  DEFAULT_MAX_SCAN_ITEMS,
  DEFAULT_PAGE_LIMIT,
  fetchGraphMedia,
  MAX_LOOKBACK_YEARS,
} from "./graph-client";
import type { InstagramMedia } from "./types";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function createMediaItems(
  count: number,
  options?: {
    prefix?: string;
    baseTimestampMs?: number;
    stepMs?: number;
    caption?: string;
  },
): InstagramMedia[] {
  const prefix = options?.prefix ?? "post";
  const baseMs = options?.baseTimestampMs ?? Date.parse("2026-10-15T12:00:00Z");
  const stepMs = options?.stepMs ?? 3_600_000;
  const caption = options?.caption ?? "#challenge post";

  return Array.from({ length: count }, (_, idx) => ({
    id: `${prefix}-${idx + 1}`,
    caption,
    media_url: `https://example.com/${prefix}-${idx + 1}.jpg`,
    permalink: `https://instagram.com/p/${prefix}-${idx + 1}`,
    timestamp: new Date(baseMs - idx * stepMs).toISOString(),
  }));
}

describe("fetchGraphMedia (`/me/media` pagination and filtering logic)", () => {
  it("トークン未指定時にエラーを送出する", async () => {
    await expect(fetchGraphMedia("")).rejects.toThrow("アクセストークンがありません");
  });

  it("リクエスト URL に limit=100 および期間指定時の since / until が付与される", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: createMediaItems(1) }),
    } as Response);
    globalThis.fetch = fetchMock;

    await fetchGraphMedia("token", {
      filter: {
        startDate: "2026-09-01",
        endDate: "2026-10-01",
        maxCount: 200,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(calledUrl.searchParams.get("limit")).toBe(String(DEFAULT_PAGE_LIMIT));
    expect(calledUrl.searchParams.get("since")).toBe(
      String(Math.floor(Date.parse("2026-09-01T00:00:00Z") / 1000)),
    );
    expect(calledUrl.searchParams.get("until")).toBe(
      String(Math.floor(Date.parse("2026-10-01T23:59:59Z") / 1000)),
    );
  });

  it("【複数ページ取得】24件で止まらず、paging.next / cursors.after を辿って 100件×2ページ = 200件すべて取得できる", async () => {
    const page1 = createMediaItems(100, {
      prefix: "p1",
      baseTimestampMs: Date.parse("2026-10-15T00:00:00Z"),
    });
    const page2 = createMediaItems(100, {
      prefix: "p2",
      baseTimestampMs: Date.parse("2026-10-05T00:00:00Z"),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: page1,
          paging: {
            cursors: { after: "cursor-page-2" },
            next: "https://graph.instagram.com/me/media?after=cursor-page-2",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: page2,
        }),
      } as Response);
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      filter: {
        startDate: "2026-09-01",
        endDate: "2026-10-20",
        maxCount: 200,
      },
    });

    expect(items).toHaveLength(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCallUrl = new URL(fetchMock.mock.calls[1]?.[0] as string);
    expect(secondCallUrl.searchParams.get("after")).toBe("cursor-page-2");
  });

  it("【maxCount到達停止】フィルタ合致件数が maxCount に達した時点で次ページ取得を停止する", async () => {
    const page1 = createMediaItems(100, { prefix: "p1" });
    const page2 = createMediaItems(100, { prefix: "p2" });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: page1,
          paging: {
            cursors: { after: "cursor-2" },
            next: "https://graph.instagram.com/me/media?after=cursor-2",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: page2,
          paging: {
            cursors: { after: "cursor-3" },
            next: "https://graph.instagram.com/me/media?after=cursor-3",
          },
        }),
      } as Response);
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      filter: {
        startDate: "2026-01-01",
        endDate: "2026-10-20",
        maxCount: 150,
      },
    });

    // 2ページ目（計200件）で maxCount=150 を満たすため、3ページ目はリクエストしない
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(200);
  });

  it("【最大スキャン500件上限】合致件数が maxCount 未満でも累積スキャン500件（5ページ）で打ち切る", async () => {
    const fetchMock = vi.fn().mockImplementation((urlStr: string) => {
      const url = new URL(urlStr);
      const after = url.searchParams.get("after") ?? "0";
      const pageNum = Number(after) + 1;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: createMediaItems(100, {
            prefix: `p${pageNum}`,
            caption: "#other_tag",
          }),
          paging: {
            cursors: { after: String(pageNum) },
            next: `https://graph.instagram.com/me/media?after=${pageNum}`,
          },
        }),
      } as Response);
    });
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      filter: {
        hashtag: "target_tag",
        startDate: "2025-01-01",
        endDate: "2026-10-20",
        maxCount: 200,
      },
    });

    // 100件 × 5ページ = 500件 (DEFAULT_MAX_SCAN_ITEMS) で確実に停止すること
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(items).toHaveLength(DEFAULT_MAX_SCAN_ITEMS);
  });

  it("【期間指定あり・Early Exit】startDate より古い投稿に到達した時点でそれ以前を除外し次ページ取得を打ち切る", async () => {
    const inRangeItems = createMediaItems(30, {
      prefix: "in-range",
      baseTimestampMs: Date.parse("2026-10-10T00:00:00Z"),
    });
    const olderItems = createMediaItems(10, {
      prefix: "out-of-range",
      baseTimestampMs: Date.parse("2026-08-15T00:00:00Z"),
    });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [...inRangeItems, ...olderItems],
        paging: {
          cursors: { after: "cursor-next" },
          next: "https://graph.instagram.com/me/media?after=cursor-next",
        },
      }),
    } as Response);
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      filter: {
        startDate: "2026-09-01",
        endDate: "2026-10-20",
        maxCount: 200,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(30);
  });

  it("【期間指定なし・最大2年制限】期間未指定時は現在から2年前が since に設定され、2年より古い投稿に到達した時点で打ち切る", async () => {
    const baseNow = new Date("2026-10-20T00:00:00Z");
    const twoYearsAgoMs = calculateMaxLookbackMs(baseNow, MAX_LOOKBACK_YEARS);

    const withinTwoYears = createMediaItems(40, {
      prefix: "recent",
      baseTimestampMs: Date.parse("2025-05-01T00:00:00Z"),
    });
    const olderThanTwoYears = createMediaItems(10, {
      prefix: "ancient",
      baseTimestampMs: Date.parse("2024-01-15T00:00:00Z"), // 2年超前
    });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [...withinTwoYears, ...olderThanTwoYears],
        paging: {
          cursors: { after: "cursor-more" },
          next: "https://graph.instagram.com/me/media?after=cursor-more",
        },
      }),
    } as Response);
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      now: baseNow,
      filter: {
        maxCount: 200,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(calledUrl.searchParams.get("since")).toBe(String(Math.floor(twoYearsAgoMs / 1000)));
    expect(calledUrl.searchParams.get("until")).toBeNull();
    // 2年以内の40件のみが含まれ、2年超前の10件は除外＆次ページ取得を打ち切る
    expect(items).toHaveLength(40);
  });

  it("【異常系・冪等性】同一カーソルによる無限ループ防止と重複 id の排除が機能する", async () => {
    const duplicateItems = [
      {
        id: "dup-1",
        caption: "hello",
        media_url: "https://example.com/1.jpg",
        permalink: "https://instagram.com/p/1",
        timestamp: "2026-10-10T00:00:00Z",
      },
      {
        id: "dup-1",
        caption: "hello",
        media_url: "https://example.com/1.jpg",
        permalink: "https://instagram.com/p/1",
        timestamp: "2026-10-10T00:00:00Z",
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: duplicateItems,
        paging: {
          cursors: { after: "same-cursor" },
          next: "https://graph.instagram.com/me/media?after=same-cursor",
        },
      }),
    } as Response);
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      filter: {
        startDate: "2026-10-01",
        endDate: "2026-10-20",
        maxCount: 200,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("dup-1");
  });

  it("【途中ページリトライ】2ページ目取得時に一時エラーが発生しても、2ページ目のみリトライして完走する", async () => {
    const page1 = createMediaItems(100, { prefix: "p1" });
    const page2 = createMediaItems(50, { prefix: "p2" });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: page1,
          paging: {
            cursors: { after: "cursor-p2" },
            next: "https://graph.instagram.com/me/media?after=cursor-p2",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Service Unavailable",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: page2,
        }),
      } as Response);
    globalThis.fetch = fetchMock;

    const items = await fetchGraphMedia("token", {
      filter: {
        startDate: "2026-09-01",
        endDate: "2026-10-20",
        maxCount: 200,
      },
      minRetryDelayMs: 1,
      maxRetryDelayMs: 5,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(items).toHaveLength(150);
  });
});
