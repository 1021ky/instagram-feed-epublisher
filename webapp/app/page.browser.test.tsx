/**
 * @file トップページの結合テスト。
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
import { calculatePresetDates } from "@/features/feed-filter";

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

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function renderDemoPage() {
  const screen = await render(<Page />);
  await screen.getByRole("button", { name: /デモを体験する/ }).click();

  const filterSection = screen.getByRole("region", { name: "フィード絞り込みフォーム" });
  const postListSection = screen.getByRole("region", { name: "投稿確認・選択リスト" });

  return { screen, filterSection, postListSection };
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
        globalThis.fetch = vi
          .fn()
          .mockResolvedValue(createJsonResponse({ hashtags: [], scannedPosts: 0 }));

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

  describe("デモ体験モードの画面操作と投稿選択", () => {
    it("デモ開始時に Step 1〜3 と全 100 件の投稿が表示され、デモ終了で未ログイン状態へ戻ること", async () => {
      const { screen, filterSection, postListSection } = await renderDemoPage();

      await expect.element(filterSection).toBeVisible();
      await expect.element(postListSection).toBeVisible();
      await expect.element(postListSection.getByText("選択中: 100 / 100 件")).toBeVisible();

      await screen.getByRole("button", { name: "デモを終了" }).click();
      await expect
        .element(screen.getByRole("button", { name: "Instagramでログイン" }))
        .toBeVisible();
    });

    it("デモ体験中に条件変更を試みると制限案内バナーが表示され、閉じるボタンで消せること", async () => {
      const { filterSection } = await renderDemoPage();

      await filterSection.getByRole("button", { name: "直近30日" }).click();
      await expect
        .element(filterSection.getByText(/デモ体験中は条件を変更できません/))
        .toBeVisible();

      await filterSection.getByRole("button", { name: "案内を閉じる" }).click();
      await expect
        .element(filterSection.getByText(/デモ体験中は条件を変更できません/))
        .not.toBeInTheDocument();
    });

    it("キャプションキーワード検索で投稿を絞り込み、クリアボタンで全件に戻せること", async () => {
      const { postListSection } = await renderDemoPage();
      const searchInput = postListSection.getByLabelText("キャプション内キーワード検索");

      await searchInput.fill("Day 3 の記録");
      await expect.element(postListSection.getByText("該当: 1 件")).toBeVisible();

      await postListSection.getByRole("button", { name: "検索キーワードをクリア" }).click();
      await expect.element(searchInput).toHaveValue("");
      await expect.element(postListSection.getByText(/該当:/)).not.toBeInTheDocument();
    });

    it("カルーセル子画像を全解除すると親投稿も除外され、親の再選択で全写真が復帰すること", async () => {
      const { postListSection } = await renderDemoPage();
      await postListSection.getByLabelText("キャプション内キーワード検索").fill("Day 3 の記録");

      const carouselGroup = postListSection.getByRole("group", {
        name: "カルーセル画像の収録選択",
      });
      await expect.element(postListSection.getByText("収録する写真を選択（3/3枚）")).toBeVisible();

      await carouselGroup.getByRole("checkbox", { name: /^画像 1 を/ }).click();
      await expect.element(postListSection.getByText("収録する写真を選択（2/3枚）")).toBeVisible();

      await carouselGroup.getByRole("checkbox", { name: /^画像 2 を/ }).click();
      await carouselGroup.getByRole("checkbox", { name: /^画像 3 を/ }).click();
      await expect.element(postListSection.getByText("選択中: 99 / 100 件")).toBeVisible();
      await expect.element(postListSection.getByText("収録する写真を選択（0/3枚）")).toBeVisible();

      await postListSection.getByRole("checkbox", { name: "この投稿をEPUBに収録" }).click();
      await expect.element(postListSection.getByText("選択中: 100 / 100 件")).toBeVisible();
      await expect.element(postListSection.getByText("収録する写真を選択（3/3枚）")).toBeVisible();
    });

    it("選択解除で EPUB 生成と次へボタンが無効化され、すべて選択で復帰すること", async () => {
      const { screen, postListSection } = await renderDemoPage();
      const generateButton = screen.getByRole("button", { name: /EPUBを生成してダウンロード/ });
      const nextButton = screen.getByRole("button", { name: /本の設定に進む/ });

      await postListSection.getByRole("button", { name: "選択解除" }).click();
      await expect.element(postListSection.getByText("選択中: 0 / 100 件")).toBeVisible();
      await expect.element(generateButton).toBeDisabled();
      await expect.element(nextButton).toBeDisabled();

      await postListSection.getByRole("button", { name: "すべて選択" }).click();
      await expect.element(postListSection.getByText("選択中: 100 / 100 件")).toBeVisible();
      await expect.element(generateButton).not.toBeDisabled();
      await expect.element(nextButton).not.toBeDisabled();
    });

    it("並び順の切替で先頭投稿と Step 3 の組版注記が同期すること", async () => {
      const { screen, postListSection } = await renderDemoPage();

      await postListSection.getByRole("button", { name: "新しい順" }).click();
      await expect
        .element(postListSection.getByRole("article").first())
        .toHaveTextContent(/Day 100 の記録です。/);
      await expect
        .element(screen.getByText(/Step 2 の並び順（新しい順）で組版されます/))
        .toBeVisible();
    });
  });

  describe("EPUB 装丁設定と書き出しフロー", () => {
    it("タイトル空欄で生成を実行するとエラー表示と入力欄フォーカスが行われ、推奨タイトル入力で解消されること", async () => {
      const { screen } = await renderDemoPage();
      const titleInput = screen.getByLabelText(/書籍タイトル/);

      await titleInput.fill("");
      await screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }).click();

      await expect.element(titleInput).toHaveAttribute("aria-invalid", "true");
      await expect.element(titleInput).toHaveFocus();

      await screen.getByRole("button", { name: "推奨タイトルを入力" }).click();
      await expect.element(titleInput).toHaveValue("@demo_100daysの投稿記録");
      await expect.element(titleInput).toHaveAttribute("aria-invalid", "false");
    });

    it("表紙テーマをキーボード矢印キーで変更でき、選択テーマが EPUB 生成リクエストへ反映されること", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(new Blob(["mock-epub-binary"], { type: "application/epub+zip" }), {
          status: 200,
        }),
      );
      globalThis.fetch = fetchMock;

      const { screen } = await renderDemoPage();
      const themeGroup = screen.getByRole("radiogroup", { name: "表紙テーマ" });

      await themeGroup.getByRole("radio", { checked: true }).click();
      await userEvent.keyboard("{ArrowRight}");
      await expect
        .element(themeGroup.getByRole("radio", { checked: true }))
        .toHaveAttribute("data-theme-id", "slate");

      await screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }).click();
      await expect.element(screen.getByRole("dialog")).toBeVisible();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(requestUrl).toBe("/api/epub/demo");
      const sentBody = JSON.parse(String(requestInit.body)) as {
        coverTheme: string;
        metadata: { title: string };
        selectedMediaIds: string[];
      };
      expect(sentBody.coverTheme).toBe("slate");
      expect(sentBody.metadata.title).toBe("100日チャレンジの記録");
      expect(sentBody.selectedMediaIds).toHaveLength(100);
    });

    it("EPUB 生成完了モーダル表示中は背面が inert 化され、閉じた後も完了バナーから再表示できること", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(new Blob(["mock-epub-binary"], { type: "application/epub+zip" }), {
          status: 200,
        }),
      );

      const { screen } = await renderDemoPage();
      await screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }).click();

      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog.getByText("EPUBの準備ができました")).toBeVisible();
      expect(screen.container.querySelector("[inert]")).not.toBeNull();

      await dialog.getByRole("button", { name: "閉じる" }).click();
      await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
      expect(screen.container.querySelector("[inert]")).toBeNull();

      await expect.element(screen.getByText("EPUBの書き出しが完了しました")).toBeVisible();
      await screen.getByRole("button", { name: "転送ガイド・ダウンロードを再表示" }).click();
      await expect.element(screen.getByRole("dialog")).toBeVisible();
    });

    it("EPUB 生成 API が失敗した場合、エラーモーダルが表示されること", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(createJsonResponse({ error: "画像取得に失敗しました" }, 500));

      const { screen } = await renderDemoPage();
      await screen.getByRole("button", { name: /EPUBを生成してダウンロード/ }).click();

      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog.getByText("エラーが発生しました")).toBeVisible();
      await expect.element(dialog.getByText(/画像取得に失敗しました/)).toBeVisible();
    });
  });

  describe("ログイン済み時のフィルター・認証・退会フロー", () => {
    function setupLoggedInFeedApiMock() {
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/instagram/hashtags")) {
          return createJsonResponse({
            hashtags: [{ tag: "京都カフェ", count: 3, lastUsedAt: "2026-09-20T09:00:00.000Z" }],
            scannedPosts: 5,
          });
        }
        if (url.startsWith("/api/instagram/media")) {
          return createJsonResponse({
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
          });
        }
        return new Response("Not Found", { status: 404 });
      }) as typeof fetch;
    }

    it("ハッシュタグ候補チップの選択と期間プリセット切替で入力欄が連動すること", async () => {
      authMocks.useSession.mockReturnValue(createLoggedInSession("alice"));
      setupLoggedInFeedApiMock();

      const screen = await render(<Page />);
      const filterSection = screen.getByRole("region", { name: "フィード絞り込みフォーム" });

      const kyotoChip = filterSection.getByRole("button", { name: /#京都カフェ/ });
      await expect.element(kyotoChip).toBeVisible();
      await kyotoChip.click();
      await expect
        .element(filterSection.getByLabelText(/ハッシュタグ絞り込み/))
        .toHaveValue("京都カフェ");

      const startInput = filterSection.getByLabelText("開始日");
      const endInput = filterSection.getByLabelText("終了日");
      const preset100 = calculatePresetDates("100days");

      await filterSection.getByRole("button", { name: "直近100日" }).click();
      await expect.element(startInput).toHaveValue(preset100.startDate ?? "");
      await expect.element(endInput).toHaveValue(preset100.endDate ?? "");

      await filterSection.getByRole("button", { name: "全期間" }).click();
      await expect.element(startInput).toHaveValue("");
      await expect.element(endInput).toHaveValue("");
    });

    it("投稿取得後に絞り込み条件が自動折りたたみされ、再展開・再折りたたみできること", async () => {
      authMocks.useSession.mockReturnValue(createLoggedInSession("alice"));
      setupLoggedInFeedApiMock();

      const screen = await render(<Page />);
      const filterSection = screen.getByRole("region", { name: "フィード絞り込みフォーム" });
      await expect
        .element(filterSection.getByRole("button", { name: /#京都カフェ/ }))
        .toBeVisible();

      await filterSection.getByRole("button", { name: /#京都カフェ/ }).click();
      await filterSection.getByRole("button", { name: "全期間" }).click();
      await filterSection.getByRole("button", { name: "この条件で投稿を取得" }).click();

      const summarySection = screen.getByRole("region", { name: "フィード絞り込み条件サマリー" });
      await expect.element(summarySection).toBeVisible();
      await expect.element(summarySection).toHaveTextContent(/#京都カフェ \/ 全期間 \/ 1件取得中/);

      await summarySection.getByRole("button", { name: /絞り込み条件を展開/ }).click();
      await expect.element(filterSection).toBeVisible();

      await filterSection.getByRole("button", { name: "絞り込み条件を折りたたむ" }).click();
      await expect.element(summarySection).toBeVisible();
    });

    it("ログアウト実行後にステータスバナーが表示され、閉じるボタンで消せること", async () => {
      let currentSession:
        | ReturnType<typeof createLoggedInSession>
        | { data: null; isPending: false } = createLoggedInSession("alice");
      authMocks.useSession.mockImplementation(() => currentSession);
      authMocks.signOut.mockImplementation(async () => {
        currentSession = { data: null, isPending: false };
      });
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(createJsonResponse({ hashtags: [], scannedPosts: 0 }));

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

    it("退会モーダルを開くと背面が inert 化され、Escape キーで閉じられること", async () => {
      authMocks.useSession.mockReturnValue(createLoggedInSession("alice"));
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(createJsonResponse({ hashtags: [], scannedPosts: 0 }));

      const screen = await render(<Page />);
      await screen.getByRole("button", { name: "退会して連携を解除" }).click();

      await expect.element(screen.getByRole("dialog")).toBeVisible();
      expect(screen.container.querySelector("[inert]")).not.toBeNull();

      await userEvent.keyboard("{Escape}");
      await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
      expect(screen.container.querySelector("[inert]")).toBeNull();
    });

    it("退会 API が失敗した場合はエラー表示されて閉じず、再実行成功で完了ステップへ遷移すること", async () => {
      authMocks.useSession.mockReturnValue(createLoggedInSession("alice"));

      let deleteAttempt = 0;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/instagram/hashtags")) {
          return createJsonResponse({ hashtags: [], scannedPosts: 0 });
        }
        if (url === "/api/user/delete") {
          deleteAttempt += 1;
          if (deleteAttempt === 1) {
            return createJsonResponse({ error: "セッション破棄に失敗しました" }, 500);
          }
          return createJsonResponse({ ok: true });
        }
        return new Response("Not Found", { status: 404 });
      }) as typeof fetch;

      const screen = await render(<Page />);
      await screen.getByRole("button", { name: "退会して連携を解除" }).click();

      await screen.getByRole("button", { name: "退会を実行する" }).click();
      await expect
        .element(screen.getByRole("dialog").getByText("セッション破棄に失敗しました"))
        .toBeVisible();

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
