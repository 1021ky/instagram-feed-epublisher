/**
 * @file 退会モーダルの確認ステップとしてセッション破棄・Instagram 側制約の説明と実行/キャンセル操作を表示する。
 */
"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { ActionButton } from "@/components/atoms";

/**
 * 退会確認ステップが受け取るプロパティ。
 */
export interface AccountDeletionConfirmStepProps {
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * 退会モーダルの確認ステップ（アプリ内処理・Instagram 側制約の説明と実行操作）。
 */
export function AccountDeletionConfirmStep({
  isDeleting,
  error,
  onConfirm,
  onClose,
}: AccountDeletionConfirmStepProps) {
  return (
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
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
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
        <ActionButton
          variant="secondary"
          onClick={onClose}
          disabled={isDeleting}
          className="w-full sm:w-auto font-medium text-slate-600 hover:bg-slate-100"
        >
          キャンセル
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={onConfirm}
          isLoading={isDeleting}
          className="w-full sm:w-auto px-5"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>退会処理中…</span>
            </>
          ) : (
            <span>退会を実行する</span>
          )}
        </ActionButton>
      </div>
    </div>
  );
}
