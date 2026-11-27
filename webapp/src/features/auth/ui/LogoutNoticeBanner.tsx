/**
 * @file ログアウト直後の完了通知バナーを表示し、対象ユーザー名の整形と通知を閉じる操作を提供する。
 */
"use client";

import { StatusBanner } from "@/components/molecules";
import { formatLogoutBannerTitle } from "../model/profile";

/**
 * ログアウト完了通知バナーコンポーネントのプロパティ。
 */
export interface LogoutNoticeBannerProps {
  /** ログアウトしたアカウントのユーザー名（未設定時は汎用文言を表示） */
  username?: string;
  /** 閉じるボタン押下時のハンドラ */
  onDismiss: () => void;
  /** 外枠に追加するクラス名 */
  className?: string;
}

/**
 * ログアウト完了をユーザーへ知らせるインライン通知バナーを描画する。
 */
export function LogoutNoticeBanner({
  username,
  onDismiss,
  className = "max-w-xl mx-auto",
}: LogoutNoticeBannerProps) {
  return (
    <StatusBanner
      className={className}
      title={formatLogoutBannerTitle(username)}
      onDismiss={onDismiss}
    />
  );
}
