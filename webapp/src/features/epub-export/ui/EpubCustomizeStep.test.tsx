import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { EpubCustomSettings } from "@/types/ui";
import { EpubCustomizeStep } from "./EpubCustomizeStep";

/** 全項目が入力された標準状態の装丁設定データ */
const baseSettings: EpubCustomSettings = {
  title: "@demo_userの投稿記録",
  subtitle: "100日チャレンジ",
  author: "@demo_user",
  coverTheme: "navy",
  sortOrder: "asc",
  contact: "demo@example.com",
  instagramUrl: "https://instagram.com/demo_user",
};

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
          settings={{ ...baseSettings, sortOrder }}
          onChange={() => undefined}
        />,
      );

      expect(html).toContain("Step 3: EPUBの装丁を整える");
      expect(html).toContain(expectedNote);
      expect(html).toContain("表紙テーマ");
      expect(html).toContain("書籍タイトル");
      expect(html).toContain("必須");
      expect(html).toContain("サブタイトル");
      expect(html).toContain("著者名");
      expect(html).toContain("連絡先（メールなど）");
      expect(html).toContain("Instagram URL");
    },
  );

  it.each([
    {
      label: "有効なタイトル時はエラーを表示しない",
      title: "有効なタイトル",
      showValidationErrors: true,
      expectError: false,
      expectRestoreButton: false,
    },
    {
      label: "空文字で検証表示有効時はインラインエラーと推奨タイトル入力補助を表示する",
      title: "",
      showValidationErrors: true,
      expectError: true,
      expectRestoreButton: true,
    },
    {
      label: "空白のみで検証表示有効時はインラインエラーを表示する",
      title: "   ",
      showValidationErrors: true,
      expectError: true,
      expectRestoreButton: true,
    },
    {
      label: "空文字でも初期表示（未操作・未送信）ではエラーを表示しない",
      title: "",
      showValidationErrors: false,
      expectError: false,
      expectRestoreButton: true,
    },
  ])(
    "書籍タイトルの必須バリデーション表示: $label",
    ({ title, showValidationErrors, expectError, expectRestoreButton }) => {
      const html = renderToStaticMarkup(
        <EpubCustomizeStep
          defaultTitle="@demo_userの投稿記録"
          showValidationErrors={showValidationErrors}
          settings={{
            title,
            author: "@demo_user",
            coverTheme: "navy",
            sortOrder: "asc",
          }}
          onChange={() => undefined}
        />,
      );

      expect(html).toContain('required=""');
      expect(html).toContain('aria-required="true"');

      if (expectError) {
        expect(html).toContain('role="alert"');
        expect(html).toContain("書籍タイトルを入力してください");
        expect(html).toContain('aria-invalid="true"');
      } else {
        expect(html).not.toContain('role="alert"');
        expect(html).not.toContain('aria-invalid="true"');
      }

      if (expectRestoreButton) {
        expect(html).toContain("推奨タイトルを入力");
      } else {
        expect(html).not.toContain("推奨タイトルを入力");
      }
    },
  );
});
