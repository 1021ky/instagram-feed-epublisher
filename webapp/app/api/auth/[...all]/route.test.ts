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

describe("/api/auth/[...all] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET handler", () => {
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

  describe("POST handler", () => {
    it("handlers.POST を呼び出してそのレスポンスを返すこと", async () => {
      const expectedResponse = new Response("created", { status: 201 });
      mockHandlers.POST.mockResolvedValue(expectedResponse);

      const request = new Request("https://localhost/api/auth/sign-in", { method: "POST" });
      const response = await POST(request);

      expect(mockHandlers.POST).toHaveBeenCalledWith(request);
      expect(response).toBe(expectedResponse);
    });
  });
});
