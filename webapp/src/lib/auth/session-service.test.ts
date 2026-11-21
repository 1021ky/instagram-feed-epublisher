/**
 * @file Unit tests for session service.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      getAccessToken: vi.fn(),
      listUserAccounts: vi.fn(),
    },
  },
}));

import { resolveInstagramAccessToken } from "./session-service";
import { auth } from "@/lib/auth";

const mockedAuth = auth as unknown as {
  api: {
    getSession: ReturnType<typeof vi.fn>;
    getAccessToken: ReturnType<typeof vi.fn>;
    listUserAccounts: ReturnType<typeof vi.fn>;
  };
};

describe("Instagram アクセストークン解決 (resolveInstagramAccessToken)", () => {
  it("getAccessToken API からアクセストークンを取得できること", async () => {
    mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
    mockedAuth.api.getAccessToken.mockResolvedValue({ accessToken: "token_from_get_access_token" });

    const token = await resolveInstagramAccessToken(new Request("http://localhost"));
    expect(token).toBe("token_from_get_access_token");
    expect(mockedAuth.api.getAccessToken).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { providerId: "instagram", useAccountCookie: true },
    });
  });

  it("getAccessToken が null を返した場合に listUserAccounts API からフォールバック取得できること", async () => {
    mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
    mockedAuth.api.getAccessToken.mockResolvedValue(null);
    mockedAuth.api.listUserAccounts.mockResolvedValue([
      { providerId: "google", accessToken: "google_token" },
      { providerId: "instagram", accessToken: "instagram_token" },
    ]);

    const token = await resolveInstagramAccessToken(new Request("http://localhost"));
    expect(token).toBe("instagram_token");
  });

  it("getAccessToken が例外を投げた場合に listUserAccounts API からフォールバック取得できること", async () => {
    mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
    mockedAuth.api.getAccessToken.mockRejectedValue(new Error("API Error"));
    mockedAuth.api.listUserAccounts.mockResolvedValue([
      { providerId: "instagram", accessToken: "instagram_token_fallback" },
    ]);

    const token = await resolveInstagramAccessToken(new Request("http://localhost"));
    expect(token).toBe("instagram_token_fallback");
  });

  it("セッションが存在しない場合に未ログインエラーを送出すること", async () => {
    mockedAuth.api.getSession.mockResolvedValue(null);

    await expect(resolveInstagramAccessToken(new Request("http://localhost"))).rejects.toThrow(
      "未ログインです",
    );
  });

  it("Instagram のアクセストークンが見つからない場合にエラーを送出すること", async () => {
    mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
    mockedAuth.api.getAccessToken.mockResolvedValue(null);
    mockedAuth.api.listUserAccounts.mockResolvedValue([
      { providerId: "google", accessToken: "google_token" },
    ]);

    await expect(resolveInstagramAccessToken(new Request("http://localhost"))).rejects.toThrow(
      "Instagram access token not found in session",
    );
  });
});
