/**
 * @file Unit tests for Instagram OAuth endpoint URL resolution (`auth.ts`).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_INSTAGRAM_OAUTH_AUTHORIZE_URL,
  DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL,
  exchangeInstagramToken,
  getInstagramUserInfo,
  resolveInstagramOAuthUrls,
} from "./auth";

const originalAuthorizeEnv = process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL;
const originalTokenEnv = process.env.INSTAGRAM_OAUTH_TOKEN_URL;

afterEach(() => {
  if (originalAuthorizeEnv === undefined) {
    delete process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL;
  } else {
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = originalAuthorizeEnv;
  }

  if (originalTokenEnv === undefined) {
    delete process.env.INSTAGRAM_OAUTH_TOKEN_URL;
  } else {
    process.env.INSTAGRAM_OAUTH_TOKEN_URL = originalTokenEnv;
  }
});

describe("Instagram OAuth エンドポイント URL 解決 (resolveInstagramOAuthUrls)", () => {
  it.each([
    { label: "未定義 (undefined)", value: undefined },
    { label: "空文字", value: "" },
    { label: "空白のみ", value: "   " },
    { label: "スラッシュのみ", value: "///" },
  ])(
    "環境変数が $label の場合、認可・トークン交換ともに本番デフォルト URL へフォールバックする",
    ({ value }) => {
      if (value === undefined) {
        delete process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL;
        delete process.env.INSTAGRAM_OAUTH_TOKEN_URL;
      } else {
        process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = value;
        process.env.INSTAGRAM_OAUTH_TOKEN_URL = value;
      }

      expect(resolveInstagramOAuthUrls()).toEqual({
        authorizeUrl: DEFAULT_INSTAGRAM_OAUTH_AUTHORIZE_URL,
        tokenUrl: DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL,
      });
    },
  );

  it("カスタム URL（前後空白・末尾スラッシュあり）が指定された場合に正規化して返す", () => {
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = "  http://127.0.0.1:4010/oauth/authorize///  ";
    process.env.INSTAGRAM_OAUTH_TOKEN_URL = "http://127.0.0.1:4010/oauth/access_token/";

    expect(resolveInstagramOAuthUrls()).toEqual({
      authorizeUrl: "http://127.0.0.1:4010/oauth/authorize",
      tokenUrl: "http://127.0.0.1:4010/oauth/access_token",
    });
  });

  it("片方の環境変数のみ指定された場合、未指定側は本番デフォルト URL を維持する", () => {
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = "http://127.0.0.1:4010/oauth/authorize";
    delete process.env.INSTAGRAM_OAUTH_TOKEN_URL;

    expect(resolveInstagramOAuthUrls()).toEqual({
      authorizeUrl: "http://127.0.0.1:4010/oauth/authorize",
      tokenUrl: DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL,
    });
  });
});

describe("Instagram OAuth トークン交換・プロファイル取得の並列化 (exchangeInstagramToken & getInstagramUserInfo)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("exchangeInstagramToken が短期トークン取得後、長期トークン交換とユーザー情報取得を並列実行すること", async () => {
    const fetchMock = vi.fn().mockImplementation((urlInput: string) => {
      const url = String(urlInput);
      if (url.includes("/oauth/access_token")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            access_token: "short_token_123",
            user_id: "user_123",
            expires_in: 3600,
          }),
        } as Response);
      }
      if (url.includes("/access_token")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            access_token: "long_token_456",
            expires_in: 5184000,
          }),
        } as Response);
      }
      if (url.includes("/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: "1784140001",
            username: "fast_user",
          }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    globalThis.fetch = fetchMock;

    const result = await exchangeInstagramToken({
      code: "code_abc",
      redirectURI: "https://localhost:3000/api/auth/oauth2/callback/instagram",
    });

    expect(result.accessToken).toBe("long_token_456");
    expect(result.raw).toEqual(
      expect.objectContaining({
        profile: {
          id: "1784140001",
          username: "fast_user",
        },
      }),
    );
    // 合計3回（短期トークンPOST 1回 + 並列GET 2回）呼ばれていること
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("getInstagramUserInfo は事前に profile が存在する場合、追加 fetch なしで即座に返却すること", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const userInfo = await getInstagramUserInfo({
      accessToken: "long_token_456",
      raw: {
        profile: {
          id: "1784140001",
          username: "fast_user",
        },
      },
    });

    expect(userInfo).toEqual({
      id: "1784140001",
      name: "fast_user",
      email: "fast_user@instagram.local",
      emailVerified: false,
      image: undefined,
    });
    // fetch が一切呼ばれていないこと（0ms）
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getInstagramUserInfo は profile が未取得の場合、フォールバックとして /me を fetch すること", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "1784140002",
        username: "fallback_user",
      }),
    } as Response);
    globalThis.fetch = fetchMock;

    const userInfo = await getInstagramUserInfo({
      accessToken: "long_token_789",
    });

    expect(userInfo).toEqual({
      id: "1784140002",
      name: "fallback_user",
      email: "fallback_user@instagram.local",
      emailVerified: false,
      image: undefined,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
