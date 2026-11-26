"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ActionButton } from "@/components/atoms";

/**
 * 退会完了ステップが受け取るプロパティ。
 */
export interface AccountDeletionCompletedStepProps {
  onCompleteClose: () => void;
}

/**
 * 退会モーダルの完了ステップ（Instagram 側の連携解除リンクとデータ削除手順案内）。
 */
export function AccountDeletionCompletedStep({
  onCompleteClose,
}: AccountDeletionCompletedStepProps) {
  return (
    <div className="space-y-4 my-5 text-xs sm:text-sm text-slate-600">
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-start gap-2">
          <ExternalLink className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" aria-hidden="true" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Instagram アカウント側でも連携を完全に解除する場合
          </h3>
        </div>
        <p className="m-0 leading-relaxed text-xs text-slate-600">
          Instagram 側の「アプリとウェブサイト」設定から「feeds2epub - IG」を削除してください。
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
        <ActionButton
          variant="secondary"
          onClick={onCompleteClose}
          className="w-full sm:w-auto px-5 border-slate-300 hover:bg-slate-100"
        >
          閉じる（トップページへ）
        </ActionButton>
      </div>
    </div>
  );
}
