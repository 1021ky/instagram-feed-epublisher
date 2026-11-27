import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

/** セッション状態・サインイン・サインアウトの遷移を検証するための Better Auth モック */
const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
  signInWithInstagram: vi.fn(),
}));

vi.mock("@/lib/auth-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-client")>();
  return {
    ...actual,
    authClient: {
      ...actual.authClient,
      useSession: authMocks.useSession,
      signOut: authMocks.signOut,
    },
    signInWithInstagram: authMocks.signInWithInstagram,
  };
});

import { useAuthFlow } from "./useAuthFlow";

function AuthFlowHarness({
  onError,
  onResetDemo,
  onLoggedOut,
}: {
  onError: (msg: string | null) => void;
  onResetDemo: () => void;
  onLoggedOut: () => void;
}) {
  const flow = useAuthFlow({ onError, onResetDemo, onLoggedOut });

  return (
    <div>
      <p data-testid="mode">{flow.appMode}</p>
      <p data-testid="username">{flow.username}</p>
      <p data-testid="loading">{String(flow.loadingLogin)}</p>
      <p data-testid="notice">{flow.logoutNotice?.username ?? ""}</p>
      <button type="button" onClick={() => void flow.handleLogin()}>
        ログイン
      </button>
      <button type="button" onClick={() => void flow.handleLogout()}>
        ログアウト
      </button>
      <button type="button" onClick={flow.enterDemoMode}>
        デモ開始
      </button>
      <button type="button" onClick={flow.dismissLogoutNotice}>
        通知を閉じる
      </button>
    </div>
  );
}

describe("認証フローフック (useAuthFlow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useSession.mockReturnValue({ data: null, isPending: false });
    authMocks.signOut.mockResolvedValue(undefined);
    authMocks.signInWithInstagram.mockResolvedValue(undefined);
  });

  it("ログイン失敗時にエラーコールバックへ通知しローディングを解除すること", async () => {
    authMocks.signInWithInstagram.mockRejectedValue(new Error("OAuth 認証エラー"));
    const onError = vi.fn();

    const screen = await render(
      <AuthFlowHarness onError={onError} onResetDemo={vi.fn()} onLoggedOut={vi.fn()} />,
    );

    await screen.getByRole("button", { name: "ログイン" }).click();

    expect(onError).toHaveBeenLastCalledWith("OAuth 認証エラー");
    await expect.element(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("デモモード中のログアウトは signOut を呼ばず onResetDemo を実行すること", async () => {
    const onResetDemo = vi.fn();
    const screen = await render(
      <AuthFlowHarness onError={vi.fn()} onResetDemo={onResetDemo} onLoggedOut={vi.fn()} />,
    );

    await screen.getByRole("button", { name: "デモ開始" }).click();
    await expect.element(screen.getByTestId("mode")).toHaveTextContent("demo");

    await screen.getByRole("button", { name: "ログアウト" }).click();

    expect(authMocks.signOut).not.toHaveBeenCalled();
    expect(onResetDemo).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByTestId("mode")).toHaveTextContent("real");
  });

  it("通常ログアウト時に signOut と onLoggedOut を呼び、ログアウト通知のセットと解除ができること", async () => {
    authMocks.useSession.mockReturnValue({
      data: { user: { id: "u1", name: "alice", email: "alice@instagram.local" } },
      isPending: false,
    });
    const onLoggedOut = vi.fn();

    const screen = await render(
      <AuthFlowHarness onError={vi.fn()} onResetDemo={vi.fn()} onLoggedOut={onLoggedOut} />,
    );

    await screen.getByRole("button", { name: "ログアウト" }).click();

    expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    expect(onLoggedOut).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByTestId("notice")).toHaveTextContent("alice");

    await screen.getByRole("button", { name: "通知を閉じる" }).click();
    await expect.element(screen.getByTestId("notice")).toHaveTextContent("");
  });
});
