/**
 * @file Integration tests for GET /api/instagram/media (Test Pyramid - Integration Layer with mocked Meta API boundary).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InstagramMedia } from "@/lib/instagram/types";

vi.mock("@/lib/auth/session-service", () => ({
  resolveInstagramAccessToken: vi.fn(),
}));

import { GET } from "./route";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveInstagramAccessToken).mockResolvedValue("mock-instagram-access-token");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function buildMockPosts(
  count: number,
  options: {
    prefix: string;
    baseTimestampMs: number;
    stepMs?: number;
    caption?: (index: number) => string;
  },
): InstagramMedia[] {
  const stepMs = options.stepMs ?? 3_600_000;
  return Array.from({ length: count }, (_, idx) => ({
    id: `${options.prefix}-${idx + 1}`,
    caption: options.caption ? options.caption(idx) : "#100days Post content",
    media_url: `https://example.com/${options.prefix}-${idx + 1}.jpg`,
    permalink: `https://instagram.com/p/${options.prefix}-${idx + 1}`,
    timestamp: new Date(options.baseTimestampMs - idx * stepMs).toISOString(),
  }));
}

describe("投稿一覧取得 API の結合テスト (GET /api/instagram/media)", () => {
  it("【複数ページ一気通貫】100件×2ページ（計200件）を辿り、24件で止まらず200件返却する", async () => {
    const page1 = buildMockPosts(100, {
      prefix: "p1",
      baseTimestampMs: Date.parse("2026-10-15T12:00:00Z"),
    });
    const page2 = buildMockPosts(100, {
      prefix: "p2",
      baseTimestampMs: Date.parse("2026-10-05T12:00:00Z"),
    });

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
        }),
      } as Response);
    globalThis.fetch = fetchMock;

    const response = await GET(
      new Request(
        "http://localhost/api/instagram/media?startDate=2026-09-01&endDate=2026-10-20&maxCount=200",
      ),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: InstagramMedia[] };
    expect(body.items).toHaveLength(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("【ハッシュタグ絞り込み＋複数ページスキャン】複数ページから対象ハッシュタグのみを抽出し、指定件数に達した時点で停止する", async () => {
    // 各ページ100件のうち、偶数インデックス（50件）のみが #100days を持つケース
    // maxCount=120 を満たすには 3ページ（50 + 50 + 50 = 150 >= 120）取得した時点で停止し、フィルタ後に120件が返る
    const fetchMock = vi.fn().mockImplementation((urlStr: string) => {
      const url = new URL(urlStr);
      const after = url.searchParams.get("after") ?? "0";
      const pageNum = Number(after) + 1;
      const posts = buildMockPosts(100, {
        prefix: `p${pageNum}`,
        baseTimestampMs: Date.parse("2026-10-15T00:00:00Z") - pageNum * 86_400_000,
        stepMs: 60_000,
        caption: (idx) => (idx % 2 === 0 ? "#100days challenge" : "#daily lunch"),
      });

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: posts,
          paging: {
            cursors: { after: String(pageNum) },
            next: `https://graph.instagram.com/me/media?after=${pageNum}`,
          },
        }),
      } as Response);
    });
    globalThis.fetch = fetchMock;

    const response = await GET(
      new Request(
        "http://localhost/api/instagram/media?hashtag=100days&startDate=2026-09-01&endDate=2026-10-20&maxCount=120",
      ),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: InstagramMedia[] };
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(body.items).toHaveLength(120);
    expect(body.items.every((item) => item.caption?.includes("#100days"))).toBe(true);
  });

  it("【期間指定なし・最大2年下限】期間未指定時は2年以内の投稿をページング取得し、2年より古い投稿が出現した時点で停止して返却する", async () => {
    const page1 = buildMockPosts(100, {
      prefix: "p1",
      baseTimestampMs: Date.now() - 30 * 86_400_000, // 約1ヶ月前
    });
    const recentInPage2 = buildMockPosts(30, {
      prefix: "p2-recent",
      baseTimestampMs: Date.now() - 300 * 86_400_000, // 約10ヶ月前（2年以内）
    });
    const olderThanTwoYearsInPage2 = buildMockPosts(20, {
      prefix: "p2-old",
      baseTimestampMs: Date.now() - 800 * 86_400_000, // 2年超前
    });

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
        ok: true,
        status: 200,
        json: async () => ({
          data: [...recentInPage2, ...olderThanTwoYearsInPage2],
          paging: {
            cursors: { after: "cursor-p3" },
            next: "https://graph.instagram.com/me/media?after=cursor-p3",
          },
        }),
      } as Response);
    globalThis.fetch = fetchMock;

    const response = await GET(new Request("http://localhost/api/instagram/media?maxCount=200"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: InstagramMedia[] };
    // 2ページ目で2年超前の投稿に到達したため、3ページ目はリクエストせず、2年以内の 130件 のみが返る
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.items).toHaveLength(130);
  });

  it("【リトライ回復結合】ページネーション途中で Meta API が一時的レート制限を返しても、自動リトライで回復し全件返却する", async () => {
    const page1 = buildMockPosts(50, {
      prefix: "p1",
      baseTimestampMs: Date.parse("2026-10-15T00:00:00Z"),
    });
    const page2 = buildMockPosts(50, {
      prefix: "p2",
      baseTimestampMs: Date.parse("2026-10-10T00:00:00Z"),
    });

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
        status: 400,
        headers: new Headers({ "retry-after": "0" }),
        text: async () =>
          JSON.stringify({
            error: {
              message: "(#4) Application request limit reached",
              code: 4,
              is_transient: true,
              fbtrace_id: "trace-rate-limit",
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

    const response = await GET(
      new Request(
        "http://localhost/api/instagram/media?startDate=2026-10-01&endDate=2026-10-20&maxCount=100",
      ),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: InstagramMedia[] };
    expect(body.items).toHaveLength(100);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("【エラー応答ステータス結合】トークン失効(code: 190)はリトライせず即座に HTTP 401 を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Invalid OAuth access token.",
            code: 190,
            is_transient: false,
            fbtrace_id: "trace-auth-error",
          },
        }),
    } as Response);
    globalThis.fetch = fetchMock;

    const response = await GET(
      new Request("http://localhost/api/instagram/media?startDate=2026-10-01&endDate=2026-10-20"),
    );

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("Graph API error: 400");
  });
});
