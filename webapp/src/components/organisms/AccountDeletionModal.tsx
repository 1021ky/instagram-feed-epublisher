"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";

/**
 * 退会モーダルの表示ステップ。
 */
export type AccountDeletionStep = "confirm" | "completed";

/**
 * 退会モーダルが受け取るプロパティ定義。
 */
export type AccountDeletionModalProps = {
  isOpen: boolean;
  step: AccountDeletionStep;
  isDeleting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  onCompleteClose: () => void;
};

/**
 * Instagram 連携の解除（退会）確認および完了後の手順案内モーダル。
 *
 * Instagram API の仕様制約（アプリ側からユーザーの認可レコードを外部削除できない点）を踏まえ、
 * 本サービス内データの消去と Instagram アカウント側での連携解除手順を明示的に案内する。
 */
export function AccountDeletionModal({
  isOpen,
  step,
  isDeleting = false,
  error = null,
  onConfirm,
  onClose,
  onCompleteClose,
}: AccountDeletionModalProps) {
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (step === "confirm" && !isDeleting) {
          onClose();
        } else if (step === "completed") {
          onCompleteClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, isDeleting, onClose, onCompleteClose]);

  if (!isOpen) {
    return null;
  }

  const isConfirm = step === "confirm";
  const isCompleted = step === "completed";

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="presentation"
      onClick={isConfirm && !isDeleting ? onClose : isCompleted ? onCompleteClose : undefined}
    >
      <div
        className="modal-card bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 w-full max-w-lg mx-auto relative my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-deletion-title"
        aria-describedby="account-deletion-description"
        onClick={(e) => e.stopPropagation()}
      >
        {isConfirm && (
          <button
            type="button"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="モーダルを閉じる"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        <div className="card__header mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`tag inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>退会完了</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>退会確認</span>
                </>
              )}
            </span>
          </div>

          <h2
            id="account-deletion-title"
            className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1"
          >
            {isCompleted ? "退会処理が完了しました" : "FeedsToBook を退会しますか？"}
          </h2>
          <p
            id="account-deletion-description"
            className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0"
          >
            {isCompleted
              ? "本サービスに保存されたセッションおよび認証 Cookie はすべて破棄されました。"
              : "本サービス内のセッションを破棄し、アカウント連携を解除します。"}
          </p>
        </div>

        {isConfirm && (
          <div className="space-y-4 my-5 text-xs sm:text-sm text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">本アプリ内での処理</h3>
              <p className="m-0 leading-relaxed text-slate-600">
                FeedsToBook に保存されたログインセッションおよび Cookie はすべて破棄されます。
                当サービスは投稿画像や電子書籍ファイルをサーバー上に永続保存しないステートレス運用の仕様です。
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <h3 className="font-bold text-xs sm:text-sm text-amber-900">
                  Instagram 側のアプリ連携設定について
                </h3>
              </div>
              <p className="m-0 leading-relaxed text-[11px] sm:text-xs text-amber-800">
                Meta（Instagram）の仕様上、外部アプリからお客様の Instagram
                アカウント内の連携登録を直接削除することはできません。 Instagram
                側でもアプリ連携を完全に解除したい場合は、退会後に Instagram
                の「アプリとウェブサイト」設定から削除を実行してください。
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 bg-white transition cursor-pointer min-h-[44px]"
                onClick={onClose}
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>退会処理中…</span>
                  </>
                ) : (
                  <span>退会を実行する</span>
                )}
              </button>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="space-y-4 my-5 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-start gap-2">
                <ExternalLink
                  className="w-4 h-4 text-purple-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Instagram アカウント側でも連携を完全に解除する場合
                </h3>
              </div>
              <p className="m-0 leading-relaxed text-xs text-slate-600">
                Instagram 側の「アプリとウェブサイト」設定から「feeds2epub -
                IG」を削除してください。
                削除すると、次回アクセス時にも完全に未連携の初期状態に戻ります。
              </p>
              <div className="pt-1">
                <a
                  href="https://www.instagram.com/accounts/manage_access/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 transition shadow-xs cursor-pointer min-h-[44px]"
                >
                  <span>Instagram のアプリ連携設定を開く</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 m-0">
              詳細な手順や個人情報の取り扱いについては、
              <Link
                href="/data-deletion"
                className="text-slate-700 font-semibold underline hover:text-purple-600 transition"
              >
                データ削除手順ページ
              </Link>
              でもご確認いただけます。
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 bg-white transition cursor-pointer min-h-[44px]"
                onClick={onCompleteClose}
              >
                閉じる（トップページへ）
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
