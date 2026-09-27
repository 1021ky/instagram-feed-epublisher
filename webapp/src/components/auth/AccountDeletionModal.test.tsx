import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountDeletionModal } from "./AccountDeletionModal";

describe("AccountDeletionModal", () => {
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

  it("step=confirm のとき確認画面・注意事項・ボタンが描画されること", () => {
    const html = renderToStaticMarkup(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        onCompleteClose={vi.fn()}
      />,
    );

    expect(html).toContain("FeedsToBook を退会しますか？");
    expect(html).toContain("本アプリ内での処理");
    expect(html).toContain("Instagram 側のアプリ連携設定について");
    expect(html).toContain("キャンセル");
    expect(html).toContain("退会を実行する");
  });

  it("isDeleting=true のとき退会処理中表示となりボタンが無効化されること", () => {
    const html = renderToStaticMarkup(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        isDeleting={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        onCompleteClose={vi.fn()}
      />,
    );

    expect(html).toContain("退会処理中…");
    expect(html).toContain('disabled=""');
  });

  it("error がある場合はエラーメッセージが表示されること", () => {
    const html = renderToStaticMarkup(
      <AccountDeletionModal
        isOpen={true}
        step="confirm"
        error="退会処理に失敗しました"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        onCompleteClose={vi.fn()}
      />,
    );

    expect(html).toContain("退会処理に失敗しました");
  });

  it("step=completed のとき完了画面・Instagram設定リンク・データ削除手順リンクが描画されること", () => {
    const html = renderToStaticMarkup(
      <AccountDeletionModal
        isOpen={true}
        step="completed"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        onCompleteClose={vi.fn()}
      />,
    );

    expect(html).toContain("退会処理が完了しました");
    expect(html).toContain("Instagram アカウント側でも連携を完全に解除する場合");
    expect(html).toContain("https://www.instagram.com/accounts/manage_access/");
    expect(html).toContain("Instagram のアプリ連携設定を開く");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("/data-deletion");
    expect(html).toContain("閉じる（トップページへ）");
  });
});
