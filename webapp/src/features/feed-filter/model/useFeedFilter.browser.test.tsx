import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { FeedPostItem } from "@/types/ui";
import { useFeedFilter, type UseFeedFilterOptions } from "./useFeedFilter";

const originalFetch = globalThis.fetch;

/**
 * テスト用 JSON レスポンスを生成する。
 */
function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * useFeedFilter の状態と操作をブラウザ上で検証するためのハーネスコンポーネント。
 */
function FeedFilterHarness(props: UseFeedFilterOptions) {
  const state = useFeedFilter(props);

  return (
    <div>
      <p data-testid="hashtag">{state.filter.hashtag ?? ""}</p>
      <p data-testid="collapsed">{String(state.isFilterCollapsed)}</p>
      <p data-testid="has-fetched">{String(state.hasFetched)}</p>
      <p data-testid="loading-hashtags">{String(state.isLoadingHashtags)}</p>
      <p data-testid="suggestions">{state.hashtagSuggestions.map((s) => s.tag).join(",")}</p>
      <button type="button" onClick={() => void state.handleFetch()}>
        取得実行
      </button>
      <button type="button" onClick={state.applyDemoFilter}>
        デモ条件適用
      </button>
      <button type="button" onClick={state.resetFilter}>
        条件リセット
      </button>
      <button type="button" onClick={state.toggleFilterCollapsed}>
        折りたたみ切替
      </button>
    </div>
  );
}

describe("フィード絞り込み・取得フック (useFeedFilter)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("ログイン済み時にハッシュタグ候補を自動取得して公開すること", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        hashtags: [{ tag: "京都カフェ", count: 5, lastUsedAt: "2026-09-20T09:00:00.000Z" }],
        scannedPosts: 10,
      }),
    );

    const screen = await render(
      <FeedFilterHarness
        isLoggedIn={true}
        isDemoMode={false}
        canUseApp={true}
        sortOrder="asc"
        onError={vi.fn()}
        onFeedFetched={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId("suggestions")).toHaveTextContent("京都カフェ");
    await expect.element(screen.getByTestId("loading-hashtags")).toHaveTextContent("false");
  });

  it("ハッシュタグ候補取得 API が失敗しても警告のみで空配列へフォールバックすること", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue(createJsonResponse({ error: "API error" }, 500));

    const screen = await render(
      <FeedFilterHarness
        isLoggedIn={true}
        isDemoMode={false}
        canUseApp={true}
        sortOrder="asc"
        onError={vi.fn()}
        onFeedFetched={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId("loading-hashtags")).toHaveTextContent("false");
    await expect.element(screen.getByTestId("suggestions")).toHaveTextContent("");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("未ログイン状態で取得実行するとエラー通知のみ行い API を呼ばないこと", async () => {
    const onError = vi.fn();
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const screen = await render(
      <FeedFilterHarness
        isLoggedIn={false}
        isDemoMode={false}
        canUseApp={false}
        sortOrder="asc"
        onError={onError}
        onFeedFetched={vi.fn()}
      />,
    );

    await screen.getByRole("button", { name: "取得実行" }).click();

    expect(onError).toHaveBeenCalledWith("先にログインしてください");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("投稿を 1 件以上取得すると全件選択状態で通知し、自動折りたたみと成功コールバックを実行すること", async () => {
    const onFeedFetched = vi.fn<(items: FeedPostItem[]) => void>();
    const onFetchSuccess = vi.fn();
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/instagram/hashtags")) {
        return createJsonResponse({ hashtags: [], scannedPosts: 0 });
      }
      return createJsonResponse({
        items: [
          {
            id: "post-1",
            media_type: "IMAGE",
            permalink: "https://www.instagram.com/p/post1/",
            timestamp: "2026-09-18T10:00:00.000Z",
          },
        ],
      });
    }) as typeof fetch;

    const screen = await render(
      <FeedFilterHarness
        isLoggedIn={true}
        isDemoMode={false}
        canUseApp={true}
        sortOrder="asc"
        onError={vi.fn()}
        onFeedFetched={onFeedFetched}
        onFetchSuccess={onFetchSuccess}
      />,
    );

    await screen.getByRole("button", { name: "取得実行" }).click();

    await expect.element(screen.getByTestId("collapsed")).toHaveTextContent("true");
    await expect.element(screen.getByTestId("has-fetched")).toHaveTextContent("true");
    expect(onFeedFetched).toHaveBeenCalledWith([
      expect.objectContaining({ id: "post-1", selected: true }),
    ]);
    expect(onFetchSuccess).toHaveBeenCalledTimes(1);
  });

  it("取得結果が 0 件のときは折りたたまず、該当なしエラーを通知すること", async () => {
    const onError = vi.fn();
    const onFetchSuccess = vi.fn();
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/instagram/hashtags")) {
        return createJsonResponse({ hashtags: [], scannedPosts: 0 });
      }
      return createJsonResponse({ items: [] });
    }) as typeof fetch;

    const screen = await render(
      <FeedFilterHarness
        isLoggedIn={true}
        isDemoMode={false}
        canUseApp={true}
        sortOrder="asc"
        onError={onError}
        onFeedFetched={vi.fn()}
        onFetchSuccess={onFetchSuccess}
      />,
    );

    await screen.getByRole("button", { name: "取得実行" }).click();

    await expect.element(screen.getByTestId("collapsed")).toHaveTextContent("false");
    await expect.element(screen.getByTestId("has-fetched")).toHaveTextContent("true");
    expect(onError).toHaveBeenLastCalledWith(
      "フィードが取得できませんでした。指定した条件に該当する投稿がないか、アカウントに投稿がありません。",
    );
    expect(onFetchSuccess).not.toHaveBeenCalled();
  });

  it("デモ条件適用とリセットでフィルター状態とサンプルハッシュタグ候補が切り替わること", async () => {
    const screen = await render(
      <FeedFilterHarness
        isLoggedIn={false}
        isDemoMode={true}
        canUseApp={true}
        sortOrder="asc"
        onError={vi.fn()}
        onFeedFetched={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId("suggestions")).toHaveTextContent(/100日チャレンジ/);

    await screen.getByRole("button", { name: "デモ条件適用" }).click();
    await expect.element(screen.getByTestId("hashtag")).toHaveTextContent("100日チャレンジ");
    await expect.element(screen.getByTestId("has-fetched")).toHaveTextContent("true");

    await screen.getByRole("button", { name: "条件リセット" }).click();
    await expect.element(screen.getByTestId("hashtag")).toHaveTextContent("");
    await expect.element(screen.getByTestId("has-fetched")).toHaveTextContent("false");
  });
});
