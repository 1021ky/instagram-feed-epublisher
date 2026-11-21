import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHandlers } = vi.hoisted(() => ({
  mockHandlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: vi.fn(() => mockHandlers),
}));

vi.mock("@/lib/auth", () => ({
  auth: {},
}));

import { GET, POST } from "./route";

describe("認証ルートハンドラ (/api/auth/[...all])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET ハンドラ", () => {
    it("handlers.GET を呼び出してそのレスポンスを返すこと", async () => {
      const expectedResponse = new Response("ok", { status: 200 });
      mockHandlers.GET.mockResolvedValue(expectedResponse);

      const request = new Request("https://localhost/api/auth/session", { method: "GET" });
      const response = await GET(request);

      expect(mockHandlers.GET).toHaveBeenCalledWith(request);
      expect(response).toBe(expectedResponse);
    });

    it("サインインまたはコールバック URL のセンシティブパラメータをマスクしてログ出力すること", async () => {
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      mockHandlers.GET.mockResolvedValue(new Response("ok"));

      const request = new Request(
        "https://localhost/api/auth/callback/instagram?code=secret12345&state=mystate&other=public",
        {
          method: "GET",
          headers: {
            host: "localhost",
            "x-forwarded-proto": "https",
          },
        },
      );

      await GET(request);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[auth] request",
        expect.objectContaining({
          method: "GET",
          pathname: "/api/auth/callback/instagram",
          params: {
            code: "***(11)",
            state: "***(7)",
            other: "public",
          },
          host: "localhost",
          proto: "https",
        }),
      );

      consoleInfoSpy.mockRestore();
    });
  });

  describe("POST ハンドラ", () => {
    it("handlers.POST を呼び出してそのレスポンスを返すこと", async () => {
      const expectedResponse = new Response("created", { status: 201 });
      mockHandlers.POST.mockResolvedValue(expectedResponse);

      const request = new Request("https://localhost/api/auth/sign-in", { method: "POST" });
      const response = await POST(request);

      expect(mockHandlers.POST).toHaveBeenCalledWith(request);
      expect(response).toBe(expectedResponse);
    });

    it.each([
      {
        label: "通常ログイン（クエリなし）",
        requestUrl: "https://localhost/api/auth/sign-in/oauth2",
        expectedForceReauth: null,
      },
      {
        label: "force_reauth=false 指定",
        requestUrl: "https://localhost/api/auth/sign-in/oauth2?force_reauth=false",
        expectedForceReauth: null,
      },
      {
        label: "別アカウントでログイン（force_reauth=true）",
        requestUrl: "https://localhost/api/auth/sign-in/oauth2?force_reauth=true",
        expectedForceReauth: "true",
      },
    ])(
      "$label のとき、認可 URL の force_reauth パラメータが期待通りになること",
      async ({ requestUrl, expectedForceReauth }) => {
        const baseAuthUrl =
          "https://www.instagram.com/oauth/authorize?client_id=cid&redirect_uri=https%3A%2F%2Flocalhost%2Fapi%2Fauth%2Foauth2%2Fcallback%2Finstagram&state=state123&enable_fb_login=0&scope=instagram_business_basic";

        mockHandlers.POST.mockResolvedValue(
          new Response(JSON.stringify({ url: baseAuthUrl, redirect: true }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": "better-auth.state=abc; Path=/; HttpOnly",
            },
          }),
        );

        const request = new Request(requestUrl, { method: "POST" });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(response.headers.get("Set-Cookie")).toBe("better-auth.state=abc; Path=/; HttpOnly");

        const payload = (await response.json()) as { url: string; redirect: boolean };
        expect(payload.redirect).toBe(true);

        const parsedUrl = new URL(payload.url);
        expect(parsedUrl.searchParams.get("force_reauth")).toBe(expectedForceReauth);
        expect(parsedUrl.searchParams.get("state")).toBe("state123");
        expect(parsedUrl.searchParams.get("redirect_uri")).toBe(
          "https://localhost/api/auth/oauth2/callback/instagram",
        );
      },
    );
  });
});
