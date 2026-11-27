import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ExportProgress } from "@/types/ui";
import { ExportModal } from "./ExportModal";

/** 書き出し完了状態の進捗データ */
const completedProgress: ExportProgress = {
  status: "completed",
  progress: 100,
  message: "完了しました",
  downloadUrl: "blob:demo",
};

/** 書き出し処理中（60%）の進捗データ */
const generatingProgress: ExportProgress = {
  status: "generating",
  progress: 60,
  message: "画像を処理中...",
};

/** 書き出し失敗時のエラー付き進捗データ */
const errorProgress: ExportProgress = {
  status: "error",
  progress: 0,
  message: "エラーが発生しました",
  error: "通信がタイムアウトしました",
};

describe("エクスポートモーダル (ExportModal)", () => {
  it.each([
    {
      label: "isOpen が false の場合",
      isOpen: false,
      progress: completedProgress,
    },
    {
      label: "isOpen が true でも status が idle の場合",
      isOpen: true,
      progress: { status: "idle" as const, progress: 0, message: "" },
    },
  ])("$label は何も描画しないこと", ({ isOpen, progress }) => {
    const html = renderToStaticMarkup(
      <ExportModal isOpen={isOpen} progress={progress} onClose={vi.fn()} />,
    );
    expect(html).toBe("");
  });

  it("完了時に利用ガイドとダウンロードボタンが描画されること", () => {
    const html = renderToStaticMarkup(
      <ExportModal isOpen progress={completedProgress} onClose={vi.fn()} onDownload={vi.fn()} />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("EPUBの準備ができました");
    expect(html).toContain("Send to Kindle");
    expect(html).toContain("Apple Books / Kobo");
    expect(html).toContain("EPUBをダウンロード");
  });

  it("生成処理中（status=generating）のときプログレスバーが表示されること", () => {
    const html = renderToStaticMarkup(
      <ExportModal isOpen progress={generatingProgress} onClose={vi.fn()} />,
    );

    expect(html).toContain("EPUBを書き出しています");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="60"');
    expect(html).toContain("60%");
    expect(html).toContain("バックグラウンドで待つ（完了時に自動表示）");
  });

  it("エラー時（status=error）のときエラーメッセージが表示されること", () => {
    const html = renderToStaticMarkup(
      <ExportModal isOpen progress={errorProgress} onClose={vi.fn()} />,
    );

    expect(html).toContain("エラーが発生しました");
    expect(html).toContain("通信がタイムアウトしました");
    expect(html).toContain("閉じる");
  });
});
