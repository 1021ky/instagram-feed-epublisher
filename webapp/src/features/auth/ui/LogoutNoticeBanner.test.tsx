import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LogoutNoticeBanner } from "./LogoutNoticeBanner";

describe("ログアウト完了通知バナー (LogoutNoticeBanner)", () => {
  it.each([
    {
      label: "ユーザー名あり（@ なし）",
      username: "alice",
      expectedTitle: "FeedsToBook からログアウトしました（@alice）",
    },
    {
      label: "ユーザー名あり（@ 付き）",
      username: "@bob",
      expectedTitle: "FeedsToBook からログアウトしました（@bob）",
    },
    {
      label: "ユーザー名未設定",
      username: undefined,
      expectedTitle: "FeedsToBook からログアウトしました",
    },
  ])(
    "$label の場合に整形済みタイトルと閉じるボタンを描画すること",
    ({ username, expectedTitle }) => {
      const html = renderToStaticMarkup(
        <LogoutNoticeBanner username={username} onDismiss={() => undefined} />,
      );

      expect(html).toContain('role="status"');
      expect(html).toContain(expectedTitle);
      expect(html).toContain('aria-label="通知を閉じる"');
      expect(html).toContain("max-w-xl mx-auto");
    },
  );
});
