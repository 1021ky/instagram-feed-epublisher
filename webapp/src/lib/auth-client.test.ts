/**
 * @file Unit tests for Instagram OAuth client helpers (`auth-client.ts`).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

describe("Instagram クライアントログインヘルパー (signInWithInstagram)", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("通常ログイン時に /api/auth/sign-in/oauth2 へ Instagram OAuth リクエストを送信すること", async () => {
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/",
      },
    });
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ url: "https://www.instagram.com/oauth/authorize", redirect: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    globalThis.fetch = fetchMock;

    const { signInWithInstagram } = await import("./auth-client");
    await signInWithInstagram();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(calledUrl);
    expect(`${parsed.pathname}${parsed.search}`).toBe("/api/auth/sign-in/oauth2");
    expect(calledInit.method).toBe("POST");
    expect(JSON.parse(String(calledInit.body))).toEqual({
      providerId: "instagram",
      callbackURL: "/?scroll=filters",
    });
  });
});

describe("ログアウト通知バナー見出しの生成 (formatLogoutBannerTitle)", () => {
  it.each([
    {
      label: "未定義 (undefined)",
      username: undefined,
      expected: "FeedsToBook からログアウトしました",
    },
    { label: "空文字", username: "", expected: "FeedsToBook からログアウトしました" },
    { label: "空白のみ", username: "   ", expected: "FeedsToBook からログアウトしました" },
    {
      label: "@なしのユーザー名",
      username: "haneprod",
      expected: "FeedsToBook からログアウトしました（@haneprod）",
    },
    {
      label: "@付きのユーザー名",
      username: "@haneprod",
      expected: "FeedsToBook からログアウトしました（@haneprod）",
    },
  ])("$label のとき、'$expected' を返すこと", async ({ username, expected }) => {
    const { formatLogoutBannerTitle } = await import("./auth-client");
    expect(formatLogoutBannerTitle(username)).toBe(expected);
  });
});
