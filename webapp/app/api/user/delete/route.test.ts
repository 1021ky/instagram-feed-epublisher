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

  it("Instagram 連携解除成功時は Better Auth Cookie を破棄すること", async () => {
    mockedResolveInstagramAccessToken.mockResolvedValue("token");
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
      }),
    );

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://graph.instagram.com/me/permissions?access_token=token",
      { method: "DELETE" },
    );
    expect(response.cookies.get("better-auth.session_token")?.maxAge).toBe(0);
    expect(response.cookies.get("better-auth.account_data")?.maxAge).toBe(0);
    expect(response.cookies.get("__Secure-better-auth.session_data")?.maxAge).toBe(0);
  });

  it("最初の失効先が失敗してもフォールバック先で成功すれば完了すること", async () => {
    mockedResolveInstagramAccessToken.mockResolvedValue("token");
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("not found", {
          status: 404,
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
        }),
      );

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "https://graph.facebook.com/me/permissions?access_token=token",
      { method: "DELETE" },
    );
  });

  it("未ログイン時は 401 を返すこと", async () => {
    mockedResolveInstagramAccessToken.mockRejectedValue(new Error("未ログインです"));

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "未ログインです" });
  });

  it("すべての失効先が失敗した場合は 502 を返すこと", async () => {
    mockedResolveInstagramAccessToken.mockResolvedValue("token");
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("bad gateway", {
          status: 502,
        }),
      )
      .mockRejectedValueOnce(new Error("network down"));

    const response = await POST(
      new Request("https://localhost/api/user/delete", { method: "POST" }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Instagram 連携の解除に失敗しました",
    });
  });
});
