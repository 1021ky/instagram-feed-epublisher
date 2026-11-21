import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EpubCustomizeStep } from "./EpubCustomizeStep";

describe("EPUB装丁設定ステップ (EpubCustomizeStep)", () => {
  it.each([
    {
      label: "古い順 (asc)",
      sortOrder: "asc" as const,
      expectedNote: "Step 2 の並び順（古い順）で組版されます",
    },
    {
      label: "新しい順 (desc)",
      sortOrder: "desc" as const,
      expectedNote: "Step 2 の並び順（新しい順）で組版されます",
    },
  ])(
    "タイトル・メタデータ・表紙テーマの設定欄と $label の案内を描画すること",
    ({ sortOrder, expectedNote }) => {
      const html = renderToStaticMarkup(
        <EpubCustomizeStep
          defaultTitle="@demo_userの投稿記録"
          settings={{
            title: "@demo_userの投稿記録",
            subtitle: "100日チャレンジ",
            author: "@demo_user",
            coverTheme: "navy",
            sortOrder,
            contact: "demo@example.com",
            instagramUrl: "https://instagram.com/demo_user",
          }}
          onChange={() => undefined}
        />,
      );

      expect(html).toContain("Step 3: EPUBの装丁を整える");
      expect(html).toContain(expectedNote);
      expect(html).toContain("表紙テーマ");
      expect(html).toContain("書籍タイトル");
      expect(html).toContain("サブタイトル");
      expect(html).toContain("著者名");
      expect(html).toContain("連絡先（メールなど）");
      expect(html).toContain("Instagram URL");
    },
  );
});
