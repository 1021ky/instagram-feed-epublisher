/**
 * @file トップページの Medium 結合テスト（Vitest Browser Mode）。
 *
 * 認証状態に応じた画面表示、デモ体験・フィード絞り込み・投稿選択・装丁設定・EPUB 生成・退会フローなど、
 * 主要なユーザー操作と画面状態遷移を実ブラウザ上で検証します。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
  signInWithInstagram: vi.fn(),
}));

vi.mock("@/lib/auth-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-client")>();
  return {
    ...actual,
    authClient: {
      ...actual.authClient,
      useSession: authMocks.useSession,
      signOut: authMocks.signOut,
    },
    signInWithInstagram: authMocks.signInWithInstagram,
  };
});

import Page from "./page";
import { calculatePresetDates } from "@/components/organisms";

const originalFetch = globalThis.fetch;
const originalCreateObjectURL = window.URL.createObjectURL;
const originalRevokeObjectURL = window.URL.revokeObjectURL;

function createLoggedInSession(username = "alice") {
  return {
    data: {
      user: {
        id: "user-1",
        name: username,
        email: `${username}@instagram.local`,
        image: undefined,
      },
    },
    isPending: false,
  };
}

describe("トップページ全体の結合振る舞い", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useSession.mockReturnValue({ data: null, isPending: false });
    authMocks.signOut.mockResolvedValue(undefined);
    authMocks.signInWithInstagram.mockResolvedValue(undefined);
    globalThis.fetch = vi.fn();
    window.URL.createObjectURL = vi.fn(() => "blob:mock-epub-url");
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  describe("認証状態ごとの初期表示", () => {
    it.each([
      {
        label: "ログアウト済みでセッション解決後",
        session: { data: null, isPending: false },
        expectLoginCard: true,
        expectAppBody: false,
        expectUsername: null,
      },
      {
        label: "セッション解決中",
        session: { data: null, isPending: true },
        expectLoginCard: false,
        expectAppBody: false,
        expectUsername: null,
      },
      {
        label: "ログイン済み",
        session: createLoggedInSession("alice"),
        expectLoginCard: false,
        expectAppBody: true,
        expectUsername: "@alice",
      },
    ])(
      "$label の場合にログインカードとアプリ本体の表示状態が適切に切り替わること",
      async ({ session, expectLoginCard, expectAppBody, expectUsername }) => {
        authMocks.useSession.mockReturnValue(session);
        globalThis.fetch = vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ hashtags: [], scannedPosts: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const screen = await render(<Page />);
        const loginButton = screen.getByRole("button", { name: "Instagramでログイン" });
        const filterRegion = screen.getByRole("region", { name: "フィード絞り込みフォーム" });

        if (expectLoginCard) {
          await expect.element(loginButton).toBeVisible();
        } else {
          await expect.element(loginButton).not.toBeInTheDocument();
        }

        if (expectAppBody) {
          await expect.element(filterRegion).toBeVisible();
        } else {
          await expect.element(filterRegion).not.toBeInTheDocument();
        }

        if (expectUsername) {
          await expect
            .element(screen.getByRole("navigation").getByText(expectUsername))
            .toBeVisible();
        }
      },
    );
  });

  describe("デモ体験モードの一気通貫フロー", () => {
    it("デモ開始から検索・クリア・一括選択・並び順・カルーセル連動・デモ終了まで動作すること", async () => {
      const screen = await render(<Page />);

      // 1. 未ログイン時はログインカードのみ表示
      await expect
        .element(screen.getByRole("button", { name: "Instagramでログイン" }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("region", { name: "フィード絞り込みフォーム" }))
        .not.toBeInTheDocument();

      // 2. デモ体験を開始
      await screen.getByRole("button", { name: /デモを体験する/ }).click();

      const filterSection = screen.getByRole("region", { name: "フィード絞り込みフォーム" });
      const postListSection = screen.getByRole("region", { name: "投稿確認・選択リスト" });
      await expect.element(filterSection).toBeVisible();
      await expect.element(postListSection).toBeVisible();
      await expect.element(postListSection.getByText("選択中: 100 / 100 件")).toBeVisible();

      // 3. デモ制限案内バナーの表示と閉じる操作
      await filterSection.getByRole("button", { name: "直近30日" }).click();
      await expect
        .element(filterSection.getByText(/デモ体験中は条件を変更できません/))
        .toBeVisible();
      await filterSection.getByRole("button", { name: "案内を閉じる" }).click();
      await expect
        .element(filterSection.getByText(/デモ体験中は条件を変更できません/))
        .not.toBeInTheDocument();

      // 4. Step 2: キャプションキーワード検索とクリアボタン
      const searchInput = postListSection.getByLabelText("キャプション内キーワード検索");
      await searchInput.fill("Day 3 の記録");
      await expect.element(postListSection.getByText("該当: 1 件")).toBeVisible();

      // カルーセル投稿（Day 3・3枚）の子画像トグルと全解除時の親投稿連動
      const carouselGroup = postListSection.getByRole("group", {
        name: "カルーセル画像の収録選択",
      });
      await expect.element(postListSection.getByText("収録する写真を選択（3/3枚）")).toBeVisible();
      await carouselGroup.getByRole("checkbox", { name: /^画像 1 を/ }).click();
      await expect.element(postListSection.getByText("収録する写真を選択（2/3枚）")).toBeVisible();
      await carouselGroup.getByRole("checkbox", { name: /^画像 2 を/ }).click();
      await carouselGroup.getByRole("checkbox", { name: /^画像 3 を/ }).click();
      // すべての子画像を外すと親投稿も自動除外され選択件数が 99 件になる
      await expect.element(postListSection.getByText("選択中: 99 / 100 件")).toBeVisible();
      await expect.element(postListSection.getByText("収録する写真を選択（0/3枚）")).toBeVisible();

      // 親投稿チェックボックスをオンに戻すと全写真が再選択される
      await postListSection.getByRole("checkbox", { name: "この投稿をEPUBに収録" }).click();
      await expect.element(postListSection.getByText("選択中: 100 / 100 件")).toBeVisible();
      await expect.element(postListSection.getByText("収録する写真を選択（3/3枚）")).toBeVisible();

      // 検索クリアボタンで全件復帰
      await postListSection.getByRole("button", { name: "検索キーワードをクリア" }).click();
      await expect.element(searchInput).toHaveValue("");
      await expect.element(postListSection.getByText(/該当:/)).not.toBeInTheDocument();

      // 5. 一括解除で EPUB 生成ボタン・アクションバーが無効化され、全選択で復帰
      await postListSection.getByRole("button", { name: "選択解除" }).click();
      await expect.element(postListSection.getByText("選択中: 0 / 100 件")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }))
        .toBeDisabled();
      await expect.element(screen.getByRole("button", { name: /本の設定に進む/ })).toBeDisabled();

      await postListSection.getByRole("button", { name: "すべて選択" }).click();
      await expect.element(postListSection.getByText("選択中: 100 / 100 件")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }))
        .not.toBeDisabled();

      // 6. 並び順切替で先頭投稿と Step 3 注記が同期する
      await postListSection.getByRole("button", { name: "新しい順" }).click();
      await expect
        .element(postListSection.getByRole("article").first())
        .toHaveTextContent(/Day 100 の記録です。/);
      await expect
        .element(screen.getByText(/Step 2 の並び順（新しい順）で組版されます/))
        .toBeVisible();

      // 7. デモを終了すると未ログイン状態へ戻る
      await screen.getByRole("button", { name: "デモを終了" }).click();
      await expect
        .element(screen.getByRole("button", { name: "Instagramでログイン" }))
        .toBeVisible();
    });

    it("Step 3 タイトル必須バリデーション・フォーカス誘導・表紙テーマキーボード選択・EPUB生成完了〜再表示が動作すること", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(new Blob(["mock-epub-binary"], { type: "application/epub+zip" }), {
          status: 200,
        }),
      );
      globalThis.fetch = fetchMock;

      const screen = await render(<Page />);
      await screen.getByRole("button", { name: /デモを体験する/ }).click();

      // 1. タイトルを空欄にして生成ボタンを押すとエラー表示＋タイトル入力欄に自動フォーカスされる
      const titleInput = screen.getByLabelText(/書籍タイトル/);
      await titleInput.fill("");
      const generateButton = screen.getByRole("button", {
        name: /EPUBを生成してダウンロード/,
      });
      await generateButton.click();

      await expect.element(titleInput).toHaveAttribute("aria-invalid", "true");
      await expect.element(titleInput).toHaveFocus();

      // 2. 「推奨タイトルを入力」ボタンで推奨タイトルが補完されエラーが解消される
      await screen.getByRole("button", { name: "推奨タイトルを入力" }).click();
      await expect.element(titleInput).toHaveValue("@demo_100daysの投稿記録");
      await expect.element(titleInput).toHaveAttribute("aria-invalid", "false");

      // 3. 表紙テーマをキーボード矢印キーで変更できる（navy -> slate）
      const themeGroup = screen.getByRole("radiogroup", { name: "表紙テーマ" });
      const checkedRadio = themeGroup.getByRole("radio", { checked: true });
      await checkedRadio.click();
      await userEvent.keyboard("{ArrowRight}");
      await expect
        .element(themeGroup.getByRole("radio", { checked: true }))
        .toHaveAttribute("data-theme-id", "slate");

      // 4. EPUB 生成を実行 → モーダル表示中は背面が inert になり完了後にダウンロード・再表示できる
      await generateButton.click();

      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog.getByText("EPUBの準備ができました")).toBeVisible();

      // 背面コンテナが inert 化されていること
      const mainWrapper = screen.container.querySelector("[inert]");
      expect(mainWrapper).not.toBeNull();

      // リクエスト先とペイロード内容を確認
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(requestUrl).toBe("/api/epub/demo");
      const sentBody = JSON.parse(String(requestInit.body)) as {
        coverTheme: string;
        metadata: { title: string };
        selectedMediaIds: string[];
      };
      expect(sentBody.coverTheme).toBe("slate");
      expect(sentBody.metadata.title).toBe("@demo_100daysの投稿記録");
      expect(sentBody.selectedMediaIds).toHaveLength(100);

      // モーダルを閉じると完了バナーが表示され、再表示ボタンで再びモーダルが開く
      await dialog.getByRole("button", { name: "閉じる" }).click();
      await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
      expect(screen.container.querySelector("[inert]")).toBeNull();

      await expect.element(screen.getByText("EPUBの書き出しが完了しました")).toBeVisible();
      await screen.getByRole("button", { name: "転送ガイド・ダウンロードを再表示" }).click();
      await expect.element(screen.getByRole("dialog")).toBeVisible();
    });

    it("EPUB 生成 API が失敗した場合、エラーモーダルとエラーバナーが表示されること", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "画像取得に失敗しました" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const screen = await render(<Page />);
      await screen.getByRole("button", { name: /デモを体験する/ }).click();

      await screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }).click();

      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog.getByText("エラーが発生しました")).toBeVisible();
      await expect.element(dialog.getByText(/画像取得に失敗しました/)).toBeVisible();
    });
  });

  describe("ログイン済み時のフィルター・認証・退会フロー", () => {
    it("期間プリセット選択・投稿取得・サマリー自動折りたたみ・再展開が動作すること", async () => {
      authMocks.useSession.mockReturnValue(createLoggedInSession("alice"));

      const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/instagram/hashtags")) {
          return new Response(
            JSON.stringify({
              hashtags: [{ tag: "京都カフェ", count: 3, lastUsedAt: "2026-09-20T09:00:00.000Z" }],
              scannedPosts: 5,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (url.startsWith("/api/instagram/media")) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: "post-1",
                  media_type: "IMAGE",
                  media_url:
                    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E",
                  caption: "京都カフェめぐり #京都カフェ",
                  timestamp: "2026-09-18T10:00:00.000Z",
                  permalink: "https://www.instagram.com/p/post1/",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("Not Found", { status: 404 });
      });
      globalThis.fetch = mockFetch as typeof fetch;

      const screen = await render(<Page />);
      const filterSection = screen.getByRole("region", { name: "フィード絞り込みフォーム" });
      await expect.element(filterSection).toBeVisible();

      // ハッシュタグ候補チップの選択
      const kyotoChip = filterSection.getByRole("button", { name: /#京都カフェ/ });
      await expect.element(kyotoChip).toBeVisible();
      await kyotoChip.click();
      await expect
        .element(filterSection.getByLabelText(/ハッシュタグ絞り込み/))
        .toHaveValue("京都カフェ");

      // 期間プリセット切替で開始日・終了日入力欄が連動する
      const startInput = filterSection.getByLabelText("開始日");
      const endInput = filterSection.getByLabelText("終了日");
      const preset100 = calculatePresetDates("100days");
      await filterSection.getByRole("button", { name: "直近100日" }).click();
      await expect.element(startInput).toHaveValue(preset100.startDate ?? "");
      await expect.element(endInput).toHaveValue(preset100.endDate ?? "");

      await filterSection.getByRole("button", { name: "全期間" }).click();
      await expect.element(startInput).toHaveValue("");
      await expect.element(endInput).toHaveValue("");

      // 投稿取得を実行 → 自動折りたたみされてサマリーカードへ遷移
      await filterSection.getByRole("button", { name: "この条件で投稿を取得" }).click();

      const summarySection = screen.getByRole("region", { name: "フィード絞り込み条件サマリー" });
      await expect.element(summarySection).toBeVisible();
      await expect.element(summarySection).toHaveTextContent(/#京都カフェ \/ 全期間 \/ 1件取得中/);

      // サマリークリックで再展開 → ヘッダーの「閉じる」で再折りたたみ
      await summarySection.getByRole("button", { name: /絞り込み条件を展開/ }).click();
      await expect.element(filterSection).toBeVisible();
      await filterSection.getByRole("button", { name: "絞り込み条件を折りたたむ" }).click();
      await expect.element(summarySection).toBeVisible();
    });

    it("ログアウト実行後にステータスバナーが表示され閉じるボタンで消せること", async () => {
      let currentSession:
        | ReturnType<typeof createLoggedInSession>
        | { data: null; isPending: false } = createLoggedInSession("alice");
      authMocks.useSession.mockImplementation(() => currentSession);
      authMocks.signOut.mockImplementation(async () => {
        currentSession = { data: null, isPending: false };
      });

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ hashtags: [], scannedPosts: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const screen = await render(<Page />);
      await screen.getByRole("button", { name: "ログアウト" }).click();

      expect(authMocks.signOut).toHaveBeenCalledTimes(1);
      await expect
        .element(screen.getByText("FeedsToBook からログアウトしました（@alice）"))
        .toBeVisible();

      await screen.getByRole("button", { name: "通知を閉じる" }).click();
      await expect
        .element(screen.getByText("FeedsToBook からログアウトしました（@alice）"))
        .not.toBeInTheDocument();
    });

    it("退会モーダルの開閉・エラー表示・退会成功後の完了ステップ遷移が動作すること", async () => {
      authMocks.useSession.mockReturnValue(createLoggedInSession("alice"));

      let deleteAttempt = 0;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/instagram/hashtags")) {
          return new Response(JSON.stringify({ hashtags: [], scannedPosts: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url === "/api/user/delete") {
          deleteAttempt += 1;
          if (deleteAttempt === 1) {
            return new Response(JSON.stringify({ error: "セッション破棄に失敗しました" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not Found", { status: 404 });
      }) as typeof fetch;

      const screen = await render(<Page />);

      // 1. 退会モーダルを開く → 背面が inert になり Escape で閉じる
      await screen.getByRole("button", { name: "退会して連携を解除" }).click();
      await expect.element(screen.getByRole("dialog")).toBeVisible();
      expect(screen.container.querySelector("[inert]")).not.toBeNull();

      await userEvent.keyboard("{Escape}");
      await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
      expect(screen.container.querySelector("[inert]")).toBeNull();

      // 2. 再度開いて退会実行（1回目: API エラー）→ モーダル内にエラー表示され閉じない
      await screen.getByRole("button", { name: "退会して連携を解除" }).click();
      await screen.getByRole("button", { name: "退会を実行する" }).click();
      await expect
        .element(screen.getByRole("dialog").getByText("セッション破棄に失敗しました"))
        .toBeVisible();

      // 3. 再実行（2回目: 成功）→ サインアウト実行され完了ステップへ遷移
      await screen.getByRole("button", { name: "退会を実行する" }).click();
      await expect
        .element(screen.getByRole("heading", { name: "退会処理が完了しました" }))
        .toBeVisible();
      expect(authMocks.signOut).toHaveBeenCalledTimes(1);
      await expect
        .element(screen.getByRole("link", { name: /Instagram のアプリ連携設定を開く/ }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("link", { name: "データ削除手順ページ" }))
        .toBeVisible();
    });
  });
});
