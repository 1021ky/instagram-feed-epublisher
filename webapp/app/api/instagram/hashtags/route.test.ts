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

describe("GET /api/instagram/hashtags (Integration + OpenAPI Contract Tests)", () => {
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

  it("limit クエリパラメータの指定・最大 50 件クランプ・不正値フォールバックが機能する", async () => {
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

    // limit=3
    const res3 = await GET(new Request("http://localhost:3100/api/instagram/hashtags?limit=3"));
    const body3 = (await res3.json()) as { hashtags: HashtagSuggestion[]; scannedPosts: number };
    assertValidOpenApiSchema(spec, "HashtagSuggestionsResponse", body3);
    expect(body3.hashtags).toHaveLength(3);

    // limit=999 -> 最大 50 件にクランプ
    const resMax = await GET(new Request("http://localhost:3100/api/instagram/hashtags?limit=999"));
    const bodyMax = (await resMax.json()) as {
      hashtags: HashtagSuggestion[];
      scannedPosts: number;
    };
    assertValidOpenApiSchema(spec, "HashtagSuggestionsResponse", bodyMax);
    expect(bodyMax.hashtags).toHaveLength(50);

    // limit=invalid -> デフォルト 20 件にフォールバック
    const resDefault = await GET(
      new Request("http://localhost:3100/api/instagram/hashtags?limit=invalid"),
    );
    const bodyDefault = (await resDefault.json()) as {
      hashtags: HashtagSuggestion[];
      scannedPosts: number;
    };
    assertValidOpenApiSchema(spec, "HashtagSuggestionsResponse", bodyDefault);
    expect(bodyDefault.hashtags).toHaveLength(20);
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
