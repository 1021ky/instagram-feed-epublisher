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

  it.each([
    {
      label: "通常ログイン（オプション省略）",
      options: undefined,
      expectedPathAndQuery: "/api/auth/sign-in/oauth2",
    },
    {
      label: "通常ログイン（forceReauth=false）",
      options: { forceReauth: false },
      expectedPathAndQuery: "/api/auth/sign-in/oauth2",
    },
    {
      label: "別アカウントでログイン（forceReauth=true）",
      options: { forceReauth: true },
      expectedPathAndQuery: "/api/auth/sign-in/oauth2?force_reauth=true",
    },
  ])(
    "$label のとき、$expectedPathAndQuery へリクエストを送信すること",
    async ({ options, expectedPathAndQuery }) => {
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
      await signInWithInstagram(options);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      const parsed = new URL(calledUrl);
      expect(`${parsed.pathname}${parsed.search}`).toBe(expectedPathAndQuery);
      expect(calledInit.method).toBe("POST");
      expect(JSON.parse(String(calledInit.body))).toEqual({
        providerId: "instagram",
        callbackURL: "/?scroll=filters",
      });
    },
  );
});
