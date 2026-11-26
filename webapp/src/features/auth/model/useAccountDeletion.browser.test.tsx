import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-client")>();
  return {
    ...actual,
    authClient: {
      ...actual.authClient,
      signOut: authMocks.signOut,
    },
  };
});

import { useAccountDeletion } from "./useAccountDeletion";

const originalFetch = globalThis.fetch;

function AccountDeletionHarness({
  onDeleted,
  onNavigateHome,
}: {
  onDeleted: () => void;
  onNavigateHome: () => void;
}) {
  const deletion = useAccountDeletion({ onDeleted, onNavigateHome });

  return (
    <div>
      <p data-testid="open">{String(deletion.isOpen)}</p>
      <p data-testid="step">{deletion.step}</p>
      <p data-testid="error">{deletion.error ?? ""}</p>
      <button type="button" onClick={deletion.openModal}>
        開く
      </button>
      <button type="button" onClick={deletion.closeModal}>
        閉じる
      </button>
      <button type="button" onClick={() => void deletion.confirmDelete()}>
        退会実行
      </button>
      <button type="button" onClick={deletion.completeClose}>
        完了閉じる
      </button>
    </div>
  );
}

describe("退会フローフック (useAccountDeletion)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.signOut.mockResolvedValue(undefined);
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("API 失敗時はエラーを保持して confirm ステップに留まり、再実行成功で completed へ遷移すること", async () => {
    let attempt = 0;
    globalThis.fetch = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) {
        return new Response(JSON.stringify({ error: "セッション破棄に失敗しました" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const onDeleted = vi.fn();
    const onNavigateHome = vi.fn();
    const screen = await render(
      <AccountDeletionHarness onDeleted={onDeleted} onNavigateHome={onNavigateHome} />,
    );

    await screen.getByRole("button", { name: "開く" }).click();
    await expect.element(screen.getByTestId("open")).toHaveTextContent("true");

    await screen.getByRole("button", { name: "退会実行" }).click();
    await expect
      .element(screen.getByTestId("error"))
      .toHaveTextContent("セッション破棄に失敗しました");
    await expect.element(screen.getByTestId("step")).toHaveTextContent("confirm");
    expect(onDeleted).not.toHaveBeenCalled();

    await screen.getByRole("button", { name: "退会実行" }).click();
    await expect.element(screen.getByTestId("step")).toHaveTextContent("completed");
    await expect.element(screen.getByTestId("error")).toHaveTextContent("");
    expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    expect(onDeleted).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "完了閉じる" }).click();
    await expect.element(screen.getByTestId("open")).toHaveTextContent("false");
    expect(onNavigateHome).toHaveBeenCalledTimes(1);
  });
});
