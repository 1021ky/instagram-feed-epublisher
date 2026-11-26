"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ModalDialog } from "@/components/molecules";
import type { AccountDeletionStep } from "../model/useAccountDeletion";
import { AccountDeletionCompletedStep } from "./AccountDeletionCompletedStep";
import { AccountDeletionConfirmStep } from "./AccountDeletionConfirmStep";

/**
 * 退会確認・完了モーダルが受け取るプロパティ。
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
 * Instagram API の仕様制約（外部アプリから認可レコードを直接削除できない点）を踏まえ、
 * 本サービス内のセッション破棄と Instagram 側の連携解除手順を 2 ステップで案内する。
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
  const isConfirm = step === "confirm";
  const isCompleted = step === "completed";

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={isConfirm ? onClose : onCompleteClose}
      labelledBy="account-deletion-title"
      describedBy="account-deletion-description"
      showCloseButton={isConfirm}
      closeDisabled={isConfirm && isDeleting}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
        <AccountDeletionConfirmStep
          isDeleting={isDeleting}
          error={error}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      )}

      {isCompleted && <AccountDeletionCompletedStep onCompleteClose={onCompleteClose} />}
    </ModalDialog>
  );
}
