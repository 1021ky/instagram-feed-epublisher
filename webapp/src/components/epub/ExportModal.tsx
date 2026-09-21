/**
 * @file Export progress modal and post-download guide.
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
 * Displays EPUB export progress and reading guidance after completion.
 */
export function ExportModal({ progress, isOpen, onClose, onDownload }: ExportModalProps) {
  if (!isOpen || progress.status === "idle") {
    return null;
  }

  const isCompleted = progress.status === "completed";
  const isError = progress.status === "error";

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className="card__header">
          <span className="tag">{isCompleted ? "完了" : isError ? "エラー" : "書き出し中"}</span>
          <h2 id="export-modal-title">
            {isCompleted ? "EPUBの準備ができました" : "EPUBを書き出しています"}
          </h2>
          <p>{progress.message}</p>
        </div>

        {!isCompleted && !isError && (
          <div className="progress-panel">
            <div className="spinner" aria-hidden="true" />
            <div>
              <div className="progress-bar" aria-label="EPUB生成進捗">
                <span style={{ width: `${progress.progress}%` }} />
              </div>
              <small>{progress.progress}%</small>
            </div>
          </div>
        )}

        {isError && progress.error && <p className="error">{progress.error}</p>}

        {isCompleted && (
          <div className="guide-list">
            <section className="guide-card">
              <h3>Send to Kindle</h3>
              <ol>
                <li>ダウンロードした EPUB を開く</li>
                <li>Amazon の「Send to Kindle」へアップロード</li>
                <li>Kindle ライブラリ同期後に端末で読む</li>
              </ol>
            </section>
            <section className="guide-card">
              <h3>Apple Books / Kobo</h3>
              <ol>
                <li>ダウンロードした EPUB を Files または Finder に保存</li>
                <li>Apple Books や Kobo Desktop / アプリへ追加</li>
                <li>ライブラリから表紙付きで閲覧</li>
              </ol>
            </section>
          </div>
        )}

        <div className="actions">
          {isCompleted && (
            <button type="button" className="primary" onClick={onDownload}>
              EPUBをダウンロード
            </button>
          )}
          <button type="button" className="ghost" onClick={onClose}>
            {isCompleted || isError ? "閉じる" : "バックグラウンドで待つ"}
          </button>
        </div>
      </div>
    </div>
  );
}
