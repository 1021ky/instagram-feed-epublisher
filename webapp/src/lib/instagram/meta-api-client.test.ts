/**
 * @file Unit tests for Meta Graph API common HTTP client (`meta-api-client.ts`).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMetaApiUrls,
  classifyGraphError,
  InstagramGraphApiError,
  isRetryableGraphError,
  META_GRAPH_API_BASE_URL,
  redactAccessToken,
  requestMetaGraphApi,
  resolveMetaGraphApiBaseUrl,
} from "./meta-api-client";

const originalFetch = globalThis.fetch;
const originalMetaBaseUrlEnv = process.env.META_GRAPH_API_BASE_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalMetaBaseUrlEnv === undefined) {
    delete process.env.META_GRAPH_API_BASE_URL;
  } else {
    process.env.META_GRAPH_API_BASE_URL = originalMetaBaseUrlEnv;
  }
  vi.restoreAllMocks();
});

describe("エラー分類・リトライ可否判定 (classifyGraphError / isRetryableGraphError)", () => {
  it("is_transient: true の場合、HTTP 400 でも Retryable (upstream) と判定される", () => {
    const result = classifyGraphError(400, {
      message: "Temporary error",
      code: 2,
      is_transient: true,
    });
    expect(result).toEqual({ kind: "upstream", retryable: true });
    expect(isRetryableGraphError(400, { is_transient: true })).toBe(true);
  });

  it.each([
    { code: 4, expectedKind: "rate_limit", expectedRecStatus: 429 },
    { code: 17, expectedKind: "rate_limit", expectedRecStatus: 429 },
    { code: 32, expectedKind: "rate_limit", expectedRecStatus: 429 },
    { code: 341, expectedKind: "rate_limit", expectedRecStatus: 429 },
    { code: 613, expectedKind: "rate_limit", expectedRecStatus: 429 },
    { code: 1, expectedKind: "upstream", expectedRecStatus: 502 },
    { code: 2, expectedKind: "upstream", expectedRecStatus: 502 },
  ])(
    "Meta エラーコード $code は HTTP 400 でも Retryable ($expectedKind) と判定され推奨ステータスは $expectedRecStatus になる",
    ({ code, expectedKind, expectedRecStatus }) => {
      const classification = classifyGraphError(400, {
        message: "Meta error",
        code,
      });
      expect(classification).toEqual({ kind: expectedKind, retryable: true });

      const err = new InstagramGraphApiError({
        message: "err",
        status: 400,
        kind: classification.kind,
        code,
        isTransient: classification.retryable,
      });
      expect(err.recommendedHttpStatus).toBe(expectedRecStatus);
    },
  );

  it.each([
    { status: 408, expectedKind: "timeout", expectedRecStatus: 504 },
    { status: 429, expectedKind: "rate_limit", expectedRecStatus: 429 },
    { status: 500, expectedKind: "upstream", expectedRecStatus: 502 },
    { status: 502, expectedKind: "upstream", expectedRecStatus: 502 },
    { status: 503, expectedKind: "upstream", expectedRecStatus: 502 },
    { status: 504, expectedKind: "timeout", expectedRecStatus: 504 },
  ])(
    "HTTP $status（非JSONボディ含む）は Retryable ($expectedKind) と判定される",
    ({ status, expectedKind, expectedRecStatus }) => {
      const classification = classifyGraphError(status);
      expect(classification).toEqual({
        kind: expectedKind,
        retryable: true,
      });

      const err = new InstagramGraphApiError({
        message: "err",
        status,
        kind: classification.kind,
      });
      expect(err.recommendedHttpStatus).toBe(expectedRecStatus);
    },
  );

  it.each([
    { status: 401, detail: undefined, expectedKind: "auth", expectedRecStatus: 401 },
    {
      status: 400,
      detail: { code: 190, is_transient: false },
      expectedKind: "auth",
      expectedRecStatus: 401,
    },
    {
      status: 403,
      detail: { code: 10, is_transient: false },
      expectedKind: "auth",
      expectedRecStatus: 401,
    },
    {
      status: 403,
      detail: { code: 200, is_transient: false },
      expectedKind: "auth",
      expectedRecStatus: 401,
    },
    {
      status: 400,
      detail: { code: 100, is_transient: false },
      expectedKind: "bad_request",
      expectedRecStatus: 400,
    },
    { status: 404, detail: undefined, expectedKind: "bad_request", expectedRecStatus: 400 },
  ])(
    "恒久エラー (status=$status, detail=$detail) は Non-Retryable ($expectedKind) と判定される",
    ({ status, detail, expectedKind, expectedRecStatus }) => {
      const classification = classifyGraphError(status, detail);
      expect(classification).toEqual({
        kind: expectedKind,
        retryable: false,
      });
      expect(isRetryableGraphError(status, detail)).toBe(false);

      const err = new InstagramGraphApiError({
        message: "err",
        status,
        kind: classification.kind,
      });
      expect(err.recommendedHttpStatus).toBe(expectedRecStatus);
    },
  );
});

describe("共通通信クライアントのリトライ・Exponential Backoff・タイムアウト動作 (requestMetaGraphApi)", () => {
  it("トークン未指定時に fetch を呼ばず即座にエラーを送出する", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    await expect(
      requestMetaGraphApi({
        path: "/me",
        accessToken: "",
      }),
    ).rejects.toThrow("アクセストークンがありません");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Meta レート制限エラー (HTTP 400, code: 4, is_transient: true) からリトライで回復する", async () => {
    const rateLimitResponse = {
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            message: "(#4) Application request limit reached",
            type: "OAuthException",
            is_transient: true,
            code: 4,
            error_subcode: 2207051,
            fbtrace_id: "trace-rate-limit-1",
          },
        }),
    } as Response;

    const successResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "123", username: "testuser" }),
    } as Response;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);
    globalThis.fetch = fetchMock;

    const payload = await requestMetaGraphApi<{ id: string; username: string }>({
      path: "/me",
      accessToken: "valid-token",
      queryParams: { fields: "id,username" },
      minRetryDelayMs: 1,
      maxRetryDelayMs: 5,
      randomizeRetry: false,
    });

    expect(payload).toEqual({ id: "123", username: "testuser" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ネットワークエラー (TypeError) およびタイムアウト (TimeoutError) からリトライで回復する", async () => {
    const timeoutErr = new Error("The operation was aborted due to timeout");
    timeoutErr.name = "TimeoutError";

    const successResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "123" }),
    } as Response;

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce(successResponse);
    globalThis.fetch = fetchMock;

    const payload = await requestMetaGraphApi<{ id: string }>({
      path: "/me",
      accessToken: "valid-token",
      minRetryDelayMs: 1,
      maxRetryDelayMs: 5,
      randomizeRetry: false,
    });

    expect(payload.id).toBe("123");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("初回 + 最大リトライ回数（計4回）すべて失敗した場合に InstagramGraphApiError をスローする", async () => {
    const serverErrorResponse = {
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    } as Response;

    const fetchMock = vi.fn().mockResolvedValue(serverErrorResponse);
    globalThis.fetch = fetchMock;

    await expect(
      requestMetaGraphApi({
        path: "/me/media",
        accessToken: "valid-token",
        retries: 3,
        minRetryDelayMs: 1,
        maxRetryDelayMs: 5,
        randomizeRetry: false,
      }),
    ).rejects.toThrow("Graph API error: 500");

    // 初回1回 + リトライ3回 = 計4回
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("Non-Retryable エラー (code: 190 トークン失効) ではリトライせず1回目で即座に失敗する", async () => {
    const authErrorResponse = {
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Error validating access token: Session has expired",
            type: "OAuthException",
            code: 190,
            error_subcode: 463,
            is_transient: false,
            fbtrace_id: "trace-auth-expired",
          },
        }),
    } as Response;

    const fetchMock = vi.fn().mockResolvedValue(authErrorResponse);
    globalThis.fetch = fetchMock;

    let caughtError: unknown;
    try {
      await requestMetaGraphApi({
        path: "/me/media",
        accessToken: "expired-token",
        retries: 3,
        minRetryDelayMs: 1,
      });
    } catch (err) {
      caughtError = err;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeInstanceOf(InstagramGraphApiError);
    const graphErr = caughtError as InstagramGraphApiError;
    expect(graphErr.kind).toBe("auth");
    expect(graphErr.code).toBe(190);
    expect(graphErr.recommendedHttpStatus).toBe(401);
    expect(graphErr.fbtraceId).toBe("trace-auth-expired");
  });

  it.each([
    {
      label: "non-retryable auth error",
      payload: {
        error: {
          message: "Error validating access token: Session has expired",
          type: "OAuthException",
          code: 190,
          is_transient: false,
          fbtrace_id: "trace-auth-200",
        },
      },
      expectedKind: "auth",
      expectedStatus: 401,
      expectedCalls: 1,
    },
    {
      label: "retryable transient error",
      payload: {
        error: {
          message: "(#2) Service temporarily unavailable",
          type: "OAuthException",
          code: 2,
          is_transient: true,
          fbtrace_id: "trace-transient-200",
        },
      },
      expectedKind: "upstream",
      expectedStatus: 502,
      expectedCalls: 2,
    },
  ])(
    "HTTP 200 JSON に error が含まれる場合 ($label) は 200 branch が分類される",
    async ({ payload, expectedKind, expectedStatus, expectedCalls }) => {
      const successResponse = {
        ok: true,
        status: 200,
        json: async () => ({ id: "ok" }),
      } as Response;

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => payload,
        } as Response)
        .mockResolvedValueOnce(successResponse);
      globalThis.fetch = fetchMock;

      if (expectedKind === "auth") {
        await expect(
          requestMetaGraphApi({
            path: "/me",
            accessToken: "valid-token",
            retries: 3,
            minRetryDelayMs: 1,
            maxRetryDelayMs: 5,
            randomizeRetry: false,
          }),
        ).rejects.toMatchObject({
          kind: "auth",
          status: expectedStatus,
          code: 190,
          recommendedHttpStatus: expectedStatus,
        });
      } else {
        await expect(
          requestMetaGraphApi<{ id: string }>({
            path: "/me",
            accessToken: "valid-token",
            retries: 3,
            minRetryDelayMs: 1,
            maxRetryDelayMs: 5,
            randomizeRetry: false,
          }),
        ).resolves.toEqual({ id: "ok" });
      }

      expect(fetchMock).toHaveBeenCalledTimes(expectedCalls);
    },
  );

  it("リクエストが timeoutMs を超過した場合に AbortSignal で中断されリトライされる", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("Timed out");
            err.name = "TimeoutError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "ok" }),
      } as Response);
    globalThis.fetch = fetchMock;

    const result = await requestMetaGraphApi<{ id: string }>({
      path: "/me",
      accessToken: "valid-token",
      timeoutMs: 15,
      minRetryDelayMs: 1,
      maxRetryDelayMs: 5,
    });

    expect(result.id).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("buildMetaApiUrls およびエラーメッセージで生の access_token が漏洩せずマスクされる", async () => {
    const secretToken = "IGQVJ_SUPER_SECRET_TOKEN_12345";
    const { url, safeUrl } = buildMetaApiUrls({
      path: "/me/media",
      accessToken: secretToken,
      queryParams: { limit: 100 },
    });

    expect(url).toContain(secretToken);
    expect(safeUrl).not.toContain(secretToken);
    expect(redactAccessToken(`token=${secretToken}`, secretToken)).toBe("token=[REDACTED]");

    const errorResponse = {
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            message: `Invalid token ${secretToken} provided`,
            code: 190,
            is_transient: false,
          },
        }),
    } as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse);

    let caughtError: Error | undefined;
    try {
      await requestMetaGraphApi({
        path: "/me/media",
        accessToken: secretToken,
        retries: 1,
        minRetryDelayMs: 1,
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).not.toContain(secretToken);
    expect(caughtError?.message).toContain("[REDACTED]");
  });
});

describe("ベース URL 解決とリクエスト URL 構築 (resolveMetaGraphApiBaseUrl / buildMetaApiUrls)", () => {
  it.each([
    { label: "未定義 (undefined)", envValue: undefined },
    { label: "空文字", envValue: "" },
    { label: "空白のみ", envValue: "   " },
    { label: "単一スラッシュのみ", envValue: "/" },
    { label: "空白と複数スラッシュのみ", envValue: "  ///  " },
  ])(
    "META_GRAPH_API_BASE_URL が $label の場合、本番デフォルト URL へフォールバックする",
    ({ envValue }) => {
      if (envValue === undefined) {
        delete process.env.META_GRAPH_API_BASE_URL;
      } else {
        process.env.META_GRAPH_API_BASE_URL = envValue;
      }

      expect(resolveMetaGraphApiBaseUrl()).toBe(META_GRAPH_API_BASE_URL);
      expect(resolveMetaGraphApiBaseUrl()).toBe("https://graph.instagram.com");
    },
  );

  it.each([
    {
      label: "末尾スラッシュなし",
      envValue: "http://127.0.0.1:4010",
      expected: "http://127.0.0.1:4010",
    },
    {
      label: "末尾に単一スラッシュあり",
      envValue: "http://127.0.0.1:4010/",
      expected: "http://127.0.0.1:4010",
    },
    {
      label: "前後空白と末尾に複数スラッシュあり",
      envValue: "  http://127.0.0.1:4010///  ",
      expected: "http://127.0.0.1:4010",
    },
    {
      label: "サブパスおよび末尾スラッシュ付き",
      envValue: "http://127.0.0.1:4010/v21.0/",
      expected: "http://127.0.0.1:4010/v21.0",
    },
  ])(
    "META_GRAPH_API_BASE_URL が設定されている場合 ($label)、前後空白と末尾スラッシュを除去して返す",
    ({ envValue, expected }) => {
      process.env.META_GRAPH_API_BASE_URL = envValue;
      expect(resolveMetaGraphApiBaseUrl()).toBe(expected);
    },
  );

  it("META_GRAPH_API_BASE_URL オーバーライド時に buildMetaApiUrls の url と safeUrl の両方に反映され二重スラッシュや不要な ? が生じない", () => {
    process.env.META_GRAPH_API_BASE_URL = "http://127.0.0.1:4010///";

    const withLeadingSlash = buildMetaApiUrls({
      path: "/me/media",
      accessToken: "secret-token",
      queryParams: { limit: 100, after: undefined, empty: "" },
    });
    expect(withLeadingSlash.safeUrl).toBe("http://127.0.0.1:4010/me/media?limit=100");
    expect(withLeadingSlash.url).toBe(
      "http://127.0.0.1:4010/me/media?limit=100&access_token=secret-token",
    );

    const withoutLeadingSlashOrQuery = buildMetaApiUrls({
      path: "me",
      accessToken: "secret-token",
      queryParams: { after: undefined, empty: "" },
    });
    expect(withoutLeadingSlashOrQuery.safeUrl).toBe("http://127.0.0.1:4010/me");
    expect(withoutLeadingSlashOrQuery.url).toBe(
      "http://127.0.0.1:4010/me?access_token=secret-token",
    );
  });
});
