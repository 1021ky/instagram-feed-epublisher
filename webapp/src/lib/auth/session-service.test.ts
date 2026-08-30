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

describe("resolveInstagramAccessToken", () => {
  it("resolves access token from getAccessToken API", async () => {
    mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
    mockedAuth.api.getAccessToken.mockResolvedValue({ accessToken: "token_from_get_access_token" });

    const token = await resolveInstagramAccessToken(new Request("http://localhost"));
    expect(token).toBe("token_from_get_access_token");
  });

  it("resolves access token from listUserAccounts API when getAccessToken returns null", async () => {
    mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
    mockedAuth.api.getAccessToken.mockResolvedValue(null);
    mockedAuth.api.listUserAccounts.mockResolvedValue([
      { providerId: "google", accessToken: "google_token" },
      { providerId: "instagram", accessToken: "instagram_token" },
    ]);

    const token = await resolveInstagramAccessToken(new Request("http://localhost"));
    expect(token).toBe("instagram_token");
  });

  it("throws error when session is missing", async () => {
    mockedAuth.api.getSession.mockResolvedValue(null);

    await expect(resolveInstagramAccessToken(new Request("http://localhost"))).rejects.toThrow(
      "未ログインです",
    );
  });

  it("throws error when access token is not found", async () => {
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
