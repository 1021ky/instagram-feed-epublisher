/**
 * @file EPUB 書き出しの進捗・エラー・完了後ガイドをモーダル表示し、生成中の誤クローズ防止と再ダウンロード操作を提供する。
 */
"use client";

import { ActionButton } from "@/components/atoms";
import { ModalDialog } from "@/components/molecules";
import type { ExportProgress } from "@/types/ui";

/**
 * エクスポート進捗モーダルコンポーネントのプロパティ。
 */
export interface ExportModalProps {
  /** EPUB 生成・書き出しの進行状態 */
  progress: ExportProgress;
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる際のハンドラ */
  onClose: () => void;
  /** 完了状態で再ダウンロードボタンを押下した際のハンドラ */
  onDownload?: () => void;
}

/**
 * EPUB エクスポートの進捗と完了後の利用ガイドを表示する。
 */
export function ExportModal({ progress, isOpen, onClose, onDownload }: ExportModalProps) {
  const isCompleted = progress.status === "completed";
  const isError = progress.status === "error";
  const isGenerating = progress.status === "generating";

  return (
    <ModalDialog
      isOpen={isOpen && progress.status !== "idle"}
      onClose={onClose}
      labelledBy="export-modal-title"
      closeDisabled={isGenerating}
    >
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed m-0">{progress.message}</p>
      </div>

      {!isCompleted && !isError && (
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5">
          <div
            className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <div
              className="h-2 rounded-full bg-slate-200 overflow-hidden mb-1.5"
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
        <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm my-4">
          {progress.error}
        </p>
      )}

      {isCompleted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
          <section className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5">Send to Kindle</h3>
            <ol className="text-[11px] sm:text-xs text-slate-500 space-y-1 pl-4 list-decimal leading-relaxed m-0">
              <li>ダウンロードした EPUB を開く</li>
              <li>Amazon の「Send to Kindle」へアップロード</li>
              <li>Kindle ライブラリ同期後に端末で読む</li>
            </ol>
          </section>
          <section className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70">
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

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        {isCompleted && (
          <ActionButton variant="gradient" onClick={onDownload} className="flex-1">
            EPUBをダウンロード
          </ActionButton>
        )}
        <ActionButton variant="secondary" onClick={onClose} className="flex-1">
          {isCompleted || isError ? "閉じる" : "バックグラウンドで待つ（完了時に自動表示）"}
        </ActionButton>
      </div>
    </ModalDialog>
  );
}
