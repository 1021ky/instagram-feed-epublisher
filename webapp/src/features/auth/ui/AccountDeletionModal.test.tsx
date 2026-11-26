import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountDeletionModal } from "./AccountDeletionModal";

describe("退会確認・完了モーダル (AccountDeletionModal)", () => {
  it("isOpen が false の場合は何も描画しないこと", () => {
    const html = renderToStaticMarkup(
      <AccountDeletionModal
        isOpen={false}
        step="confirm"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        onCompleteClose={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });

  it.each([
    {
      label: "confirm ステップの初期表示",
      props: {
        isOpen: true,
        step: "confirm" as const,
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        onCompleteClose: vi.fn(),
      },
      expectedSubstrings: [
        "FeedsToBook を退会しますか？",
        "本アプリ内での処理",
        "Instagram 側のアプリ連携設定について",
        "キャンセル",
        "退会を実行する",
        'aria-label="モーダルを閉じる"',
      ],
      unexpectedSubstrings: ['disabled=""', "退会処理が完了しました"],
    },
    {
      label: "confirm ステップの退会処理中（isDeleting=true）",
      props: {
        isOpen: true,
        step: "confirm" as const,
        isDeleting: true,
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        onCompleteClose: vi.fn(),
      },
      expectedSubstrings: ["退会処理中…", 'disabled=""'],
      unexpectedSubstrings: [],
    },
    {
      label: "confirm ステップのエラー表示",
      props: {
        isOpen: true,
        step: "confirm" as const,
        error: "退会処理に失敗しました",
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        onCompleteClose: vi.fn(),
      },
      expectedSubstrings: ["退会処理に失敗しました"],
      unexpectedSubstrings: [],
    },
    {
      label: "completed ステップの完了表示",
      props: {
        isOpen: true,
        step: "completed" as const,
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        onCompleteClose: vi.fn(),
      },
      expectedSubstrings: [
        "退会処理が完了しました",
        "Instagram アカウント側でも連携を完全に解除する場合",
        "https://www.instagram.com/accounts/manage_access/",
        "Instagram のアプリ連携設定を開く",
        'target="_blank"',
        "/data-deletion",
        "閉じる（トップページへ）",
      ],
      unexpectedSubstrings: ['aria-label="モーダルを閉じる"'],
    },
  ])(
    "$label で期待通りのモーダルが描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<AccountDeletionModal {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
