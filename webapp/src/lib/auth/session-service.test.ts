/**
 * @file Unit tests for session service.
 */
import { expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      getAccessToken: vi.fn(),
    },
  },
}));

import { resolveInstagramAccessToken } from "./session-service";
import { auth } from "@/lib/auth";

const mockedAuth = auth as unknown as {
  api: {
    getSession: ReturnType<typeof vi.fn>;
    getAccessToken: ReturnType<typeof vi.fn>;
  };
};

test("resolveInstagramAccessToken returns access token", async () => {
  mockedAuth.api.getSession.mockResolvedValue({ user: { id: "1" } });
  mockedAuth.api.getAccessToken.mockResolvedValue({ accessToken: "token" });

  const token = await resolveInstagramAccessToken(new Request("http://localhost"));
  expect(token).toBe("token");
});

test("resolveInstagramAccessToken throws when session missing", async () => {
  mockedAuth.api.getSession.mockResolvedValue(null);

  await expect(resolveInstagramAccessToken(new Request("http://localhost"))).rejects.toThrow(
    "未ログインです"
  );
});
