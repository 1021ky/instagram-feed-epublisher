import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StatusBanner } from "./StatusBanner";

describe("ステータス通知バナー (StatusBanner)", () => {
  it.each([
    {
      label: "見出しと補足説明・閉じるボタンあり",
      props: {
        title: "@ksanchu_app からログアウトしました",
        description: "必要に応じて再度ログインしてください。",
        onDismiss: vi.fn(),
      },
      expectedSubstrings: [
        'role="status"',
        "bg-sky-50",
        "@ksanchu_app からログアウトしました",
        "必要に応じて再度ログインしてください。",
        'aria-label="通知を閉じる"',
      ],
      unexpectedSubstrings: [],
    },
    {
      label: "見出しのみ・閉じるボタンあり",
      props: {
        title: "@ksanchu_app からログアウトしました",
        onDismiss: vi.fn(),
      },
      expectedSubstrings: [
        'role="status"',
        "@ksanchu_app からログアウトしました",
        'aria-label="通知を閉じる"',
      ],
      unexpectedSubstrings: [],
    },
    {
      label: "見出しのみ・閉じるボタンなし",
      props: {
        title: "処理が完了しました",
      },
      expectedSubstrings: ['role="status"', "処理が完了しました"],
      unexpectedSubstrings: ['aria-label="通知を閉じる"'],
    },
  ])(
    "$label のとき、期待通りのステータスバナーが描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(<StatusBanner {...props} />);

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
