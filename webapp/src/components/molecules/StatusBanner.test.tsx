import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StatusBanner } from "./StatusBanner";

describe("ステータス通知バナー (StatusBanner)", () => {
  it.each([
    {
      label: "見出しと補足説明・閉じるボタンあり",
      props: {
        title: "本アプリからログアウトしました",
        description: "Instagram のログイン状態は維持されています。",
        onDismiss: vi.fn(),
      },
      expectedSubstrings: [
        'role="status"',
        "bg-sky-50",
        "本アプリからログアウトしました",
        "Instagram のログイン状態は維持されています。",
        'aria-label="通知を閉じる"',
      ],
      unexpectedSubstrings: ["別のアカウントでログイン"],
    },
    {
      label: "アクションボタンあり（有効）",
      props: {
        title: "@ksanchu_app からログアウトしました",
        description: "Instagram のログイン状態はブラウザに維持されています。",
        actionLabel: "別のアカウントでログイン",
        onAction: vi.fn(),
        onDismiss: vi.fn(),
      },
      expectedSubstrings: ["@ksanchu_app からログアウトしました", "別のアカウントでログイン"],
      unexpectedSubstrings: ['disabled=""'],
    },
    {
      label: "アクションボタンあり（ローディング中の無効化）",
      props: {
        title: "@ksanchu_app からログアウトしました",
        actionLabel: "別のアカウントでログイン",
        onAction: vi.fn(),
        actionDisabled: true,
      },
      expectedSubstrings: ["別のアカウントでログイン", 'disabled=""'],
      unexpectedSubstrings: [],
    },
    {
      label: "見出しのみ・閉じるボタンなし",
      props: {
        title: "処理が完了しました",
      },
      expectedSubstrings: ['role="status"', "処理が完了しました"],
      unexpectedSubstrings: ['aria-label="通知を閉じる"', "別のアカウントでログイン"],
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
