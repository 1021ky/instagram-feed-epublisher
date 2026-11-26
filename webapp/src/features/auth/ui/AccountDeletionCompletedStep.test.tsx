import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountDeletionCompletedStep } from "./AccountDeletionCompletedStep";

describe("退会完了ステップ (AccountDeletionCompletedStep)", () => {
  it("Instagram 連携設定の外部リンク、データ削除手順リンク、閉じるボタンが描画されること", () => {
    const html = renderToStaticMarkup(<AccountDeletionCompletedStep onCompleteClose={vi.fn()} />);

    expect(html).toContain("Instagram アカウント側でも連携を完全に解除する場合");
    expect(html).toContain("https://www.instagram.com/accounts/manage_access/");
    expect(html).toContain("Instagram のアプリ連携設定を開く");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("/data-deletion");
    expect(html).toContain("閉じる（トップページへ）");
  });
});
