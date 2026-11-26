import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountDeletionConfirmStep } from "./AccountDeletionConfirmStep";

describe("退会確認ステップ (AccountDeletionConfirmStep)", () => {
  it.each([
    {
      label: "通常の確認表示",
      props: { isDeleting: false, error: null, onConfirm: vi.fn(), onClose: vi.fn() },
      expectedSubstrings: [
        "本アプリ内での処理",
        "Instagram 側のアプリ連携設定について",
        "キャンセル",
        "退会を実行する",
      ],
      unexpectedSubstrings: ['role="alert"', "退会処理中…", 'disabled=""'],
    },
    {
      label: "退会処理中（isDeleting=true）",
      props: { isDeleting: true, error: null, onConfirm: vi.fn(), onClose: vi.fn() },
      expectedSubstrings: ["退会処理中…", 'disabled=""', 'aria-busy="true"'],
      unexpectedSubstrings: ["退会を実行する"],
    },
    {
      label: "エラー表示あり",
      props: {
        isDeleting: false,
        error: "退会処理に失敗しました",
        onConfirm: vi.fn(),
        onClose: vi.fn(),
      },
      expectedSubstrings: ['role="alert"', "退会処理に失敗しました"],
      unexpectedSubstrings: [],
    },
  ])("$label で期待通りの表示になること", ({ props, expectedSubstrings, unexpectedSubstrings }) => {
    const html = renderToStaticMarkup(<AccountDeletionConfirmStep {...props} />);

    for (const expected of expectedSubstrings) {
      expect(html).toContain(expected);
    }
    for (const unexpected of unexpectedSubstrings) {
      expect(html).not.toContain(unexpected);
    }
  });
});
