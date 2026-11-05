import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ExportModal } from "./ExportModal";

describe("エクスポートモーダル (ExportModal)", () => {
  it("isOpen が false または status が idle のときは何も描画しないこと", () => {
    const html = renderToStaticMarkup(
      <ExportModal
        isOpen={false}
        progress={{ status: "idle", progress: 0, message: "" }}
        onClose={vi.fn()}
      />,
    );
    expect(html).toBe("");
  });

  it("完了時に利用ガイドとダウンロードボタンが描画されること", () => {
    const onDownload = vi.fn();
    const html = renderToStaticMarkup(
      <ExportModal
        isOpen
        progress={{
          status: "completed",
          progress: 100,
          message: "完了しました",
          downloadUrl: "blob:demo",
        }}
        onClose={vi.fn()}
        onDownload={onDownload}
      />,
    );

    expect(html).toContain("EPUBの準備ができました");
    expect(html).toContain("Send to Kindle");
    expect(html).toContain("Apple Books / Kobo");
    expect(html).toContain("EPUBをダウンロード");
  });

  it("生成処理中（status=generating）のときプログレスバーが表示されること", () => {
    const html = renderToStaticMarkup(
      <ExportModal
        isOpen
        progress={{
          status: "generating",
          progress: 60,
          message: "画像を処理中...",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain("EPUBを書き出しています");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="60"');
    expect(html).toContain("60%");
  });

  it("エラー時（status=error）のときエラーメッセージが表示されること", () => {
    const html = renderToStaticMarkup(
      <ExportModal
        isOpen
        progress={{
          status: "error",
          progress: 0,
          message: "エラーが発生しました",
          error: "通信がタイムアウトしました",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain("エラーが発生しました");
    expect(html).toContain("通信がタイムアウトしました");
  });
});
