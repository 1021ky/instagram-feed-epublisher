import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session-service", () => ({
  resolveInstagramAccessToken: vi.fn(),
}));

import { POST } from "./route";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";

const mockedResolveInstagramAccessToken = resolveInstagramAccessToken as unknown as ReturnType<
  typeof vi.fn
>;

describe("POST /api/user/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("退会成功時は Better Auth Cookie を破棄し 200 OK を返すこと", async () => {
    mockedResolveInstagramAccessToken.mockResolvedValue("token");

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });

    expect(response.cookies.get("better-auth.session_token")?.maxAge).toBe(0);
    expect(response.cookies.get("better-auth.account_data")?.maxAge).toBe(0);
    expect(response.cookies.get("__Secure-better-auth.session_data")?.maxAge).toBe(0);
  });

  it("HTTPS リクエストでは Cookie に secure 属性が付与されること", async () => {
    mockedResolveInstagramAccessToken.mockResolvedValue("token");

    const response = await POST(
      new Request("https://feedstobook.ksanchu.page/api/user/delete", {
        method: "POST",
        headers: { "x-forwarded-proto": "https" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get("better-auth.session_token")?.secure).toBe(true);
  });

  it("未ログイン時は 401 を返すこと", async () => {
    mockedResolveInstagramAccessToken.mockRejectedValue(new Error("未ログインです"));

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "未ログインです" });
  });

  it("予期せぬエラー発生時は 500 を返すこと", async () => {
    mockedResolveInstagramAccessToken.mockRejectedValue(new Error("Database failure"));

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Database failure",
    });
  });
});
