"use client";

import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * 退会モーダルの表示ステップ。
 */
export type AccountDeletionStep = "confirm" | "completed";

/**
 * 退会フローフックが受け取るコールバック設定。
 */
export interface UseAccountDeletionOptions {
  onDeleted: () => void;
  /** テスト時に画面遷移を差し替えるための任意コールバック */
  onNavigateHome?: () => void;
}

/**
 * 退会モーダルの開閉・進行状態と操作ハンドラ。
 */
export interface UseAccountDeletionResult {
  isOpen: boolean;
  step: AccountDeletionStep;
  isDeleting: boolean;
  error: string | null;
  openModal: () => void;
  closeModal: () => void;
  confirmDelete: () => Promise<void>;
  completeClose: () => void;
}

/**
 * 退会完了後にログイン前トップページへ確実に遷移するデフォルト処理。
 */
function defaultNavigateHome() {
  if (window.location.pathname === "/" && !window.location.search && !window.location.hash) {
    window.location.reload();
  } else {
    window.location.href = "/";
  }
}

/**
 * 退会（連携解除）モーダルの状態遷移とサーバー Cookie 破棄 API 呼び出しを管理するフック。
 */
export function useAccountDeletion({
  onDeleted,
  onNavigateHome = defaultNavigateHome,
}: UseAccountDeletionOptions): UseAccountDeletionResult {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<AccountDeletionStep>("confirm");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = useCallback(() => {
    setStep("confirm");
    setError(null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (!isDeleting) {
      setIsOpen(false);
      setError(null);
    }
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "退会処理に失敗しました");
      }

      // サーバー側で Cookie 破棄済みのため、クライアント側 signOut の例外は完了遷移を妨げない
      try {
        await authClient.signOut();
      } catch (authError) {
        console.warn("クライアント サインアウトで例外が発生しました:", authError);
      }

      onDeleted();
      setStep("completed");
    } catch (e) {
      console.error("退会処理でエラーが発生しました:", e);
      setError(e instanceof Error ? e.message : "退会処理に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleted]);

  const completeClose = useCallback(() => {
    setIsOpen(false);
    onNavigateHome();
  }, [onNavigateHome]);

  return {
    isOpen,
    step,
    isDeleting,
    error,
    openModal,
    closeModal,
    confirmDelete,
    completeClose,
  };
}
