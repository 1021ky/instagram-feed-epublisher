import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DataDeletionPage from "./data-deletion/page";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";

describe("法的・ポリシーページ", () => {
  it("/privacy に取得情報・利用目的・保存期間・問い合わせ先が含まれること", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);

    expect(html).toContain("プライバシーポリシー");
    expect(html).toContain("Instagram ユーザー ID");
    expect(html).toContain("EPUB 書籍を生成・ダウンロード");
    expect(html).toContain("サーバーへ永続保存しません");
    expect(html).toContain("第三者へ提供、販売、広告配信へ利用しません");
    expect(html).toContain("GitHub Issues");
  });

  it("/terms に利用条件・禁止事項・免責事項が含まれること", () => {
    const html = renderToStaticMarkup(<TermsPage />);

    expect(html).toContain("利用規約");
    expect(html).toContain("利用条件");
    expect(html).toContain("禁止事項");
    expect(html).toContain("Instagram API や Meta の仕様変更");
    expect(html).toContain("本サービスの全部または一部を変更、停止または終了");
  });

  it("/data-deletion に Meta 審査向けの削除手順が含まれること", () => {
    const html = renderToStaticMarkup(<DataDeletionPage />);

    expect(html).toContain("データ削除手順");
    expect(html).toContain("Data Deletion Instructions URL");
    expect(html).toContain("ログアウト");
    expect(html).toContain("Cookie");
    expect(html).toContain("アプリとウェブサイト");
    expect(html).toContain("サーバー上へ永続保存しません");
  });
});
