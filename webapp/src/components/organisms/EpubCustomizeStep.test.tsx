import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EpubCustomizeStep } from "./EpubCustomizeStep";

describe("EPUB装丁設定ステップ (EpubCustomizeStep)", () => {
  it("タイトル・メタデータ・表紙テーマの設定欄を描画すること", () => {
    const html = renderToStaticMarkup(
      <EpubCustomizeStep
        defaultTitle="@demo_userの投稿記録"
        settings={{
          title: "@demo_userの投稿記録",
          subtitle: "100日チャレンジ",
          author: "@demo_user",
          coverTheme: "navy",
          sortOrder: "asc",
          contact: "demo@example.com",
          instagramUrl: "https://instagram.com/demo_user",
        }}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain("Step 3: EPUBの装丁を整える");
    expect(html).toContain("古い順）で自動組版されます");
    expect(html).toContain("表紙テーマ");
    expect(html).toContain("書籍タイトル");
    expect(html).toContain("サブタイトル");
    expect(html).toContain("著者名");
    expect(html).toContain("連絡先（メールなど）");
    expect(html).toContain("Instagram URL");
  });
});
