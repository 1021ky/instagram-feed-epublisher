import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { FeedFilter } from "@/lib/client/instagram";
import type { FeedPostItem } from "@/types/ui";
import { useEpubExport } from "./useEpubExport";

/** ブラウザテスト内で差し替える前のグローバル fetch の退避参照 */
const originalFetch = globalThis.fetch;
/** ブラウザテスト内で差し替える前の URL.createObjectURL の退避参照 */
const originalCreateObjectURL = window.URL.createObjectURL;
/** ブラウザテスト内で差し替える前の URL.revokeObjectURL の退避参照 */
const originalRevokeObjectURL = window.URL.revokeObjectURL;

/** EPUB 生成呼び出し時に渡す基準フィルター条件 */
const sampleFilter: FeedFilter = {
  maxCount: 100,
  sortOrder: "asc",
};

/** EPUB 生成テストで選択済みとして渡す単一投稿サンプル */
const sampleSelectedPosts: FeedPostItem[] = [
  {
    id: "post-1",
    media_type: "IMAGE",
    media_url: "https://example.com/1.jpg",
    permalink: "https://instagram.com/p/1",
    caption: "テスト投稿",
    timestamp: "2026-09-20T10:00:00Z",
    selected: true,
  },
];

/**
 * useEpubExport の状態遷移・自動補完・Blob URL 解放を実ブラウザ上で検証するためのテスト用ハーネス。
 */
function EpubExportHarness({
  initialUsername = "",
  initialDemoMode = false,
  canUseApp = true,
  selectedPosts = sampleSelectedPosts,
  onError,
}: {
  initialUsername?: string;
  initialDemoMode?: boolean;
  canUseApp?: boolean;
  selectedPosts?: FeedPostItem[];
  onError: (message: string | null) => void;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [isDemoMode, setIsDemoMode] = useState(initialDemoMode);
  const epubExport = useEpubExport({ username, isDemoMode, onError });

  return (
    <div>
      <output data-testid="title">{epubExport.customSettings.title}</output>
      <output data-testid="author">{epubExport.customSettings.author}</output>
      <output data-testid="instagram-url">{epubExport.customSettings.instagramUrl}</output>
      <output data-testid="recommended-title">{epubExport.recommendedTitle}</output>
      <output data-testid="status">{epubExport.exportProgress.status}</output>
      <output data-testid="modal-open">{String(epubExport.isModalOpen)}</output>
      <output data-testid="show-errors">{String(epubExport.showValidationErrors)}</output>

      <input
        aria-label="書籍タイトル"
        ref={epubExport.titleInputRef}
        value={epubExport.customSettings.title}
        onChange={(event) =>
          epubExport.setCustomSettings((prev) => ({ ...prev, title: event.target.value }))
        }
      />

      <button type="button" onClick={() => setUsername("alice")}>
        aliceでログイン
      </button>
      <button
        type="button"
        onClick={() => {
          setIsDemoMode(true);
          setUsername("demo_100days");
          epubExport.applyDemoSettings("demo_100days");
        }}
      >
        デモ開始
      </button>
      <button
        type="button"
        onClick={() =>
          void epubExport.generateEpub({
            canUseApp,
            filter: sampleFilter,
            selectedPosts,
          })
        }
      >
        EPUB生成
      </button>
      <button type="button" onClick={epubExport.redownload}>
        再ダウンロード
      </button>
      <button type="button" onClick={epubExport.closeModal}>
        モーダルを閉じる
      </button>
      <button type="button" onClick={epubExport.resetExportState}>
        リセット
      </button>
    </div>
  );
}

describe("EPUB 書き出し状態フックの振る舞い (useEpubExport)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    let blobIndex = 0;
    window.URL.createObjectURL = vi.fn(() => {
      blobIndex += 1;
      return `blob:mock-epub-${blobIndex}`;
    });
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("ログイン時のユーザー名変化でタイトル・著者・URL が補完され、デモ開始時はデモメタデータが上書きされないこと", async () => {
    const onError = vi.fn();
    const screen = await render(<EpubExportHarness onError={onError} />);

    await screen.getByRole("button", { name: "aliceでログイン" }).click();
    await expect.element(screen.getByTestId("title")).toHaveTextContent("@aliceの投稿記録");
    await expect.element(screen.getByTestId("author")).toHaveTextContent("@alice");
    await expect
      .element(screen.getByTestId("instagram-url"))
      .toHaveTextContent("https://instagram.com/alice");

    await screen.getByRole("button", { name: "デモ開始" }).click();
    await expect.element(screen.getByTestId("title")).toHaveTextContent("100日チャレンジの記録");
    await expect.element(screen.getByTestId("author")).toHaveTextContent("@demo_100days");
    await expect
      .element(screen.getByTestId("instagram-url"))
      .toHaveTextContent("https://www.instagram.com/demo_100days/");
    await expect
      .element(screen.getByTestId("recommended-title"))
      .toHaveTextContent("@demo_100daysの投稿記録");
  });

  it("タイトル空欄で生成するとエラー通知・バリデーション表示・入力欄フォーカスが行われること", async () => {
    const onError = vi.fn();
    const screen = await render(<EpubExportHarness initialUsername="alice" onError={onError} />);

    const titleInput = screen.getByLabelText("書籍タイトル");
    await titleInput.fill("");
    await screen.getByRole("button", { name: "EPUB生成" }).click();

    expect(onError).toHaveBeenCalledWith("書籍タイトルを入力してください");
    await expect.element(screen.getByTestId("show-errors")).toHaveTextContent("true");
    await expect.element(titleInput).toHaveFocus();
    await expect.element(screen.getByTestId("modal-open")).toHaveTextContent("false");
  });

  it("生成成功時にダウンロードが起動し、再生成時とアンマウント時に古い Blob URL が解放されること", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(new Blob(["mock-epub"], { type: "application/epub+zip" }), {
        status: 200,
      });
    });

    const onError = vi.fn();
    const screen = await render(<EpubExportHarness initialUsername="alice" onError={onError} />);

    await screen.getByRole("button", { name: "EPUB生成" }).click();
    await expect.element(screen.getByTestId("status")).toHaveTextContent("completed");
    await expect.element(screen.getByTestId("modal-open")).toHaveTextContent("true");
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "再ダウンロード" }).click();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2);

    await screen.getByRole("button", { name: "EPUB生成" }).click();
    await expect.element(screen.getByTestId("status")).toHaveTextContent("completed");
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-epub-1");

    await screen.unmount();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-epub-2");
  });

  it("生成 API が失敗した場合にエラー状態とエラーモーダル表示へ遷移すること", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "画像取得に失敗しました" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const onError = vi.fn();
    const screen = await render(<EpubExportHarness initialUsername="alice" onError={onError} />);

    await screen.getByRole("button", { name: "EPUB生成" }).click();
    await expect.element(screen.getByTestId("status")).toHaveTextContent("error");
    await expect.element(screen.getByTestId("modal-open")).toHaveTextContent("true");
    expect(onError).toHaveBeenLastCalledWith(expect.stringContaining("画像取得に失敗しました"));
  });
});
