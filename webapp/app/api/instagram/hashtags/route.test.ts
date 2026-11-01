/**
 * @file Integration & OpenAPI contract tests for GET /api/instagram/hashtags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertValidOpenApiSchema,
  loadInstagramOpenApiSpec,
} from "../../../../scripts/openapi-contract.mjs";
import { createMockInstagramHandler } from "../../../../scripts/mock-instagram-server.mjs";
import type { HashtagSuggestion } from "@/lib/instagram/types";

vi.mock("@/lib/auth/session-service", () => ({
  resolveInstagramAccessToken: vi.fn(),
}));

vi.mock("@/lib/instagram/graph-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/instagram/graph-client")>();
  return {
    ...actual,
    fetchGraphMedia: vi.fn(actual.fetchGraphMedia),
  };
});

import { GET } from "./route";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { fetchGraphMedia, InstagramGraphApiError } from "@/lib/instagram/graph-client";

const originalFetch = globalThis.fetch;
const spec = loadInstagramOpenApiSpec();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveInstagramAccessToken).mockResolvedValue("mock-instagram-access-token");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("ハッシュタグ候補取得 API の結合・OpenAPI 契約テスト (GET /api/instagram/hashtags)", () => {
  it("直近投稿を Meta Graph API（OpenAPI モックハンドラ）から取得・集計し、OpenAPI スキーマ準拠のレスポンスを返す", async () => {
    const mockUpstream = createMockInstagramHandler({
      baseDate: new Date(),
    });
    globalThis.fetch = vi.fn().mockImplementation((input: string | URL | Request) => {
      const req = input instanceof Request ? input : new Request(String(input));
      return mockUpstream(req);
    });

    const response = await GET(new Request("http://localhost:3100/api/instagram/hashtags"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      hashtags: HashtagSuggestion[];
      scannedPosts: number;
    };

    // OpenAPI 3.1 スキーマへの完全適合を検証
    assertValidOpenApiSchema(spec, "HashtagSuggestionsResponse", body);

    expect(body.scannedPosts).toBe(8);
    expect(body.hashtags.map((h) => ({ tag: h.tag, count: h.count }))).toEqual([
      { tag: "100日チャレンジ", count: 4 },
      { tag: "京都カフェ", count: 3 },
      { tag: "朝活", count: 2 },
      { tag: "読書記録", count: 2 },
      { tag: "写真好きな人と繋がりたい", count: 1 },
      { tag: "travel", count: 1 },
    ]);
  });

  it.each([
    { label: "指定件数 (3件)", query: "?limit=3", expectedCount: 3 },
    { label: "上限クランプ (999 -> 50件)", query: "?limit=999", expectedCount: 50 },
    {
      label: "不正文字列フォールバック (invalid -> 20件)",
      query: "?limit=invalid",
      expectedCount: 20,
    },
    { label: "小数切り捨て (4.9 -> 4件)", query: "?limit=4.9", expectedCount: 4 },
    { label: "負数フォールバック (-5 -> 20件)", query: "?limit=-5", expectedCount: 20 },
    { label: "ゼロ件フォールバック (0 -> 20件)", query: "?limit=0", expectedCount: 20 },
  ])("limit クエリパラメータの境界値検証: $label", async ({ query, expectedCount }) => {
    const manyCaptions = Array.from({ length: 60 }, (_, idx) => ({
      id: `post-${idx + 1}`,
      caption: `#tag_${String(idx + 1).padStart(2, "0")}`,
      media_url: `https://example.com/${idx + 1}.jpg`,
      permalink: `https://www.instagram.com/p/post${idx + 1}/`,
      timestamp: new Date(Date.now() - idx * 60_000).toISOString(),
    }));

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: manyCaptions }),
    } as Response);

    const res = await GET(new Request(`http://localhost:3100/api/instagram/hashtags${query}`));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      hashtags: HashtagSuggestion[];
      scannedPosts: number;
    };
    assertValidOpenApiSchema(spec, "HashtagSuggestionsResponse", body);
    expect(body.hashtags).toHaveLength(expectedCount);
  });

  it("未ログイン時は HTTP 401 と OpenAPI BffErrorResponse 準拠のエラーを返す", async () => {
    vi.mocked(resolveInstagramAccessToken).mockRejectedValueOnce(new Error("未ログインです"));

    const response = await GET(new Request("http://localhost:3100/api/instagram/hashtags"));
    expect(response.status).toBe(401);

    const body = await response.json();
    assertValidOpenApiSchema(spec, "BffErrorResponse", body);
    expect(body).toEqual({ error: "未ログインです" });
  });

  it("Meta Graph API がトークン失効 (190) を返した場合、HTTP 401 を伝播する", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Invalid OAuth access token.",
            code: 190,
            is_transient: false,
            fbtrace_id: "trace-hashtag-auth",
          },
        }),
    } as Response);

    const response = await GET(new Request("http://localhost:3100/api/instagram/hashtags"));
    expect(response.status).toBe(401);

    const body = await response.json();
    assertValidOpenApiSchema(spec, "BffErrorResponse", body);
  });

  it.each([
    {
      label: "レート制限 (rate_limit)",
      kind: "rate_limit" as const,
      upstreamStatus: 429,
      expectedHttpStatus: 429,
    },
    {
      label: "上流一時障害 (upstream)",
      kind: "upstream" as const,
      upstreamStatus: 502,
      expectedHttpStatus: 502,
    },
    {
      label: "タイムアウト (timeout)",
      kind: "timeout" as const,
      upstreamStatus: 504,
      expectedHttpStatus: 504,
    },
    {
      label: "不正リクエスト (bad_request)",
      kind: "bad_request" as const,
      upstreamStatus: 400,
      expectedHttpStatus: 400,
    },
  ])(
    "InstagramGraphApiError ($label) 発生時に recommendedHttpStatus ($expectedHttpStatus) を伝播する",
    async ({ kind, upstreamStatus, expectedHttpStatus }) => {
      vi.mocked(fetchGraphMedia).mockRejectedValueOnce(
        new InstagramGraphApiError({
          message: `Graph failure: ${kind}`,
          status: upstreamStatus,
          kind,
        }),
      );

      const response = await GET(new Request("http://localhost:3100/api/instagram/hashtags"));
      expect(response.status).toBe(expectedHttpStatus);

      const body = await response.json();
      assertValidOpenApiSchema(spec, "BffErrorResponse", body);
      expect(body).toEqual({ error: `Graph failure: ${kind}` });
    },
  );

  it("Error インスタンス以外の例外がスローされた場合、HTTP 401 と既定メッセージを返す", async () => {
    vi.mocked(resolveInstagramAccessToken).mockRejectedValueOnce("non-error-value");

    const response = await GET(new Request("http://localhost:3100/api/instagram/hashtags"));
    expect(response.status).toBe(401);

    const body = await response.json();
    assertValidOpenApiSchema(spec, "BffErrorResponse", body);
    expect(body).toEqual({ error: "不明なエラー" });
  });
});
