import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ModalDialog } from "./ModalDialog";

describe("モーダルダイアログ (ModalDialog)", () => {
  it("isOpen=false のときは何も描画しないこと", () => {
    const html = renderToStaticMarkup(
      <ModalDialog isOpen={false} onClose={vi.fn()} labelledBy="dialog-title">
        <h2 id="dialog-title">タイトル</h2>
      </ModalDialog>,
    );

    expect(html).toBe("");
  });

  it.each([
    {
      label: "基本構成（閉じるボタンなし・describedBy なし）",
      props: {
        isOpen: true,
        onClose: vi.fn(),
        labelledBy: "modal-title",
      },
      expectedSubstrings: [
        'role="presentation"',
        'role="dialog"',
        'aria-modal="true"',
        'aria-labelledby="modal-title"',
        "モーダル本文",
      ],
      unexpectedSubstrings: ['aria-describedby="', 'aria-label="モーダルを閉じる"'],
    },
    {
      label: "describedBy および右上閉じるボタンあり",
      props: {
        isOpen: true,
        onClose: vi.fn(),
        labelledBy: "modal-title",
        describedBy: "modal-desc",
        showCloseButton: true,
        closeButtonLabel: "ダイアログを閉じる",
      },
      expectedSubstrings: [
        'aria-labelledby="modal-title"',
        'aria-describedby="modal-desc"',
        'aria-label="ダイアログを閉じる"',
        "min-h-[44px]",
        "min-w-[44px]",
      ],
      unexpectedSubstrings: ['disabled=""'],
    },
    {
      label: "closeDisabled=true のとき閉じるボタンが無効化される",
      props: {
        isOpen: true,
        onClose: vi.fn(),
        labelledBy: "modal-title",
        showCloseButton: true,
        closeDisabled: true,
      },
      expectedSubstrings: ['aria-label="モーダルを閉じる"', 'disabled=""'],
      unexpectedSubstrings: [],
    },
  ])(
    "$label のとき、期待通りの ARIA 属性と構造で描画されること",
    ({ props, expectedSubstrings, unexpectedSubstrings }) => {
      const html = renderToStaticMarkup(
        <ModalDialog {...props}>
          <h2 id="modal-title">確認</h2>
          <p id="modal-desc">モーダル本文</p>
        </ModalDialog>,
      );

      for (const expected of expectedSubstrings) {
        expect(html).toContain(expected);
      }
      for (const unexpected of unexpectedSubstrings) {
        expect(html).not.toContain(unexpected);
      }
    },
  );
});
