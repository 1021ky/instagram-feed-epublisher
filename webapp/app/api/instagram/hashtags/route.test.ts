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

import { GET } from "./route";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";

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

  it("Meta Graph API がトークン失効 (190) や非リトライ対象エラーを返した場合、推奨 HTTP ステータスを伝播する", async () => {
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
});
