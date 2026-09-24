import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalContactBox, LegalPage, LegalSection } from "./LegalPage";
import { SiteFooter } from "./SiteFooter";

describe("共通法的ページ UI", () => {
  it("SiteFooter に法的ページへのリンクが表示されること", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/data-deletion"');
    expect(html).toContain("プライバシーポリシー");
    expect(html).toContain("利用規約");
    expect(html).toContain("データ削除手順");
  });

  it("LegalPage と LegalSection が見出しと導線を描画すること", () => {
    const html = renderToStaticMarkup(
      <LegalPage title="サンプル規約" description="説明です。" updatedAt="2026年9月23日">
        <LegalSection title="第1条">
          <p>本文</p>
        </LegalSection>
      </LegalPage>,
    );

    expect(html).toContain("サンプル規約");
    expect(html).toContain("最終更新日: 2026年9月23日");
    expect(html).toContain("トップページへ戻る");
    expect(html).toContain("第1条");
    expect(html).toContain("本文");
  });

  it("LegalContactBox のボタンが視認性の高い白文字（!text-white）を保持すること", () => {
    const html = renderToStaticMarkup(
      <LegalSection title="お問い合わせ">
        <LegalContactBox />
      </LegalSection>,
    );

    expect(html).toContain("お問い合わせ窓口を開く");
    expect(html).toContain("!text-white");
    expect(html).toContain("!no-underline");
    expect(html).toContain("bg-blue-600");
  });
});
