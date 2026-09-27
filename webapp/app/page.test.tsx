import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: { oauth2: vi.fn() },
    signOut: vi.fn(),
  },
}));

vi.mock("@/components/auth/InAppBrowserAlert", () => ({
  InAppBrowserAlert: () => <div>IN_APP_BROWSER_ALERT</div>,
}));

vi.mock("@/components/auth/LoginCard", () => ({
  LoginCard: () => <div>LOGIN_CARD</div>,
}));

vi.mock("@/components/auth/Navbar", () => ({
  Navbar: ({ user }: { user?: { username?: string; displayName?: string } | null }) => (
    <div>{user ? `NAVBAR:${user.username ?? user.displayName ?? "unknown"}` : "NAVBAR:guest"}</div>
  ),
}));

vi.mock("@/components/feed", () => ({
  FeedFilterStep: () => <div>FEED_FILTER_STEP</div>,
  PostListStep: () => <div>POST_LIST_STEP</div>,
  StickyActionBar: () => <div>STICKY_ACTION_BAR</div>,
}));

vi.mock("@/components/epub/EpubCustomizeStep", () => ({
  EpubCustomizeStep: () => <div>EPUB_CUSTOMIZE_STEP</div>,
}));

vi.mock("@/components/epub/ExportModal", () => ({
  ExportModal: () => <div>EXPORT_MODAL</div>,
}));

import Page from "./page";
import { authClient } from "@/lib/auth-client";

const mockedUseSession = authClient.useSession as unknown as ReturnType<typeof vi.fn>;

describe("トップページの認証表示", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ログアウト済みでセッション解決後はログインカードを表示すること", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false });

    const html = renderToStaticMarkup(<Page />);

    expect(html).toContain("LOGIN_CARD");
    expect(html).not.toContain("FEED_FILTER_STEP");
  });

  it("セッション解決中はログインカードを表示しないこと", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true });

    const html = renderToStaticMarkup(<Page />);

    expect(html).not.toContain("LOGIN_CARD");
    expect(html).not.toContain("FEED_FILTER_STEP");
  });

  it("ログイン済みならアプリ本体を表示すること", () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "alice",
          email: "alice@instagram.local",
          image: "https://example.com/avatar.png",
        },
      },
      isPending: false,
    });

    const html = renderToStaticMarkup(<Page />);

    expect(html).toContain("NAVBAR:alice");
    expect(html).toContain("FEED_FILTER_STEP");
    expect(html).not.toContain("LOGIN_CARD");
  });
});
