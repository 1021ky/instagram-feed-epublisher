/**
 * @file エクスポート進捗モーダルとダウンロード後ガイド
 */
import * as React from "react";
import type { ExportProgress } from "@/types/ui";

type ExportModalProps = {
  progress: ExportProgress;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
};

/**
 * EPUB エクスポートの進捗と完了後の利用ガイドを表示する。
 */
export function ExportModal({ progress, isOpen, onClose, onDownload }: ExportModalProps) {
  if (!isOpen || progress.status === "idle") {
    return null;
  }

  const isCompleted = progress.status === "completed";
  const isError = progress.status === "error";

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="modal-card bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 w-full max-w-lg mx-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className="card__header mb-4">
          <span
            className={`tag inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isCompleted
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                : isError
                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {isCompleted ? "完了" : isError ? "エラー" : "書き出し中"}
          </span>
          <h2
            id="export-modal-title"
            className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-2.5 mb-1"
          >
            {isCompleted
              ? "EPUBの準備ができました"
              : isError
                ? "エラーが発生しました"
                : "EPUBを書き出しています"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed m-0">
            {progress.message}
          </p>
        </div>

        {!isCompleted && !isError && (
          <div className="progress-panel my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5">
            <div
              className="spinner w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <div
                className="progress-bar h-2 rounded-full bg-slate-200 overflow-hidden mb-1.5"
                role="progressbar"
                aria-label="EPUB生成進捗"
                aria-valuenow={progress.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#405DE6] via-[#C13584] to-[#E1306C] rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <small className="text-[11px] font-semibold text-slate-500 block">
                {progress.progress}%
              </small>
            </div>
          </div>
        )}

        {isError && progress.error && (
          <p className="error p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm my-4">
            {progress.error}
          </p>
        )}

        {isCompleted && (
          <div className="guide-list grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
            <section className="guide-card bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5">Send to Kindle</h3>
              <ol className="text-[11px] sm:text-xs text-slate-500 space-y-1 pl-4 list-decimal leading-relaxed m-0">
                <li>ダウンロードした EPUB を開く</li>
                <li>Amazon の「Send to Kindle」へアップロード</li>
                <li>Kindle ライブラリ同期後に端末で読む</li>
              </ol>
            </section>
            <section className="guide-card bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Apple Books / Kobo
              </h3>
              <ol className="text-[11px] sm:text-xs text-slate-500 space-y-1 pl-4 list-decimal leading-relaxed m-0">
                <li>ダウンロードした EPUB を Files または Finder に保存</li>
                <li>Apple Books や Kobo Desktop / アプリへ追加</li>
                <li>ライブラリから表紙付きで閲覧</li>
              </ol>
            </section>
          </div>
        )}

        <div className="actions flex flex-col sm:flex-row gap-2.5 pt-2">
          {isCompleted && (
            <button
              type="button"
              className="primary flex-1 px-5 py-2.5 rounded-lg text-white font-medium text-xs sm:text-sm bg-gradient-to-r from-[#405DE6] via-[#C13584] to-[#E1306C] hover:opacity-95 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[40px]"
              onClick={onDownload}
            >
              EPUBをダウンロード
            </button>
          )}
          <button
            type="button"
            className="ghost flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm hover:bg-slate-50 transition flex items-center justify-center cursor-pointer min-h-[40px]"
            onClick={onClose}
          >
            {isCompleted || isError ? "閉じる" : "バックグラウンドで待つ（完了時に自動表示）"}
          </button>
        </div>
      </div>
    </div>
  );
}
