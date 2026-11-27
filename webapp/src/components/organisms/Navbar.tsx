/**
 * @file ログイン中またはデモ体験中のユーザープロフィール表示と、ログアウト・退会（連携解除）の操作導線をヘッダーバーとして描画する。
 */
"use client";

import { LogOut } from "lucide-react";
import { InstagramBrandIcon } from "@/components/atoms";
import type { UserProfile } from "@/types/ui";

/**
 * ナビゲーションバーが受け取る描画・操作用プロパティ。
 */
type NavbarProps = {
  disabled?: boolean;
  isDemoMode?: boolean;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
  user?: UserProfile | null;
};

/**
 * ユーザー表示名からアバター代替表示用のイニシャルを生成する。
 *
 * @param user - 現在表示中のユーザープロフィール
 * @returns 先頭 2 文字の大文字イニシャル
 */
function getInitials(user?: UserProfile | null) {
  const label = user?.username ?? user?.displayName ?? "IG";
  return label.slice(0, 2).toUpperCase();
}

/**
 * アプリ共通のヘッダーナビゲーションを描画する。
 *
 * ログイン中のプロフィール表示と、ログアウト・退会（連携解除）導線の表示を担当する。
 *
 * @param props - 表示状態と操作コールバック
 * @returns ナビゲーションの JSX 要素
 */
export function Navbar({
  disabled = false,
  isDemoMode = false,
  onDeleteAccount,
  onLogout,
  user,
}: NavbarProps) {
  if (!user) {
    return null;
  }

  const accountLabel = user?.username ? `@${user.username}` : user?.displayName;

  return (
    <nav className="navbar max-w-3xl mx-auto w-full">
      <div className="navbar__brand">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-2xs">
            <InstagramBrandIcon className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
            FeedsToBook
          </span>
        </div>
      </div>

      {user && (onLogout || onDeleteAccount) ? (
        <div className="navbar__account">
          <div className="navbar__profile">
            {user.avatarUrl ? (
              <img
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                src={user.avatarUrl}
                alt={`${accountLabel ?? "ユーザー"} のアイコン`}
              />
            ) : (
              <span
                className="w-8 h-8 rounded-full inline-flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 border border-slate-200"
                aria-hidden="true"
              >
                {getInitials(user)}
              </span>
            )}
            <div className="text-left">
              <strong className="text-xs sm:text-sm font-bold text-slate-800 block">
                {accountLabel ?? "Instagram user"}
              </strong>
              {isDemoMode && (
                <p className="text-[11px] text-amber-700 font-medium m-0">デモ体験モード</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {!isDemoMode && onDeleteAccount ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition cursor-pointer min-h-[36px]"
                onClick={onDeleteAccount}
                disabled={disabled}
                aria-label="退会して連携を解除"
              >
                <span>退会（連携解除）</span>
              </button>
            ) : null}
            {onLogout ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white transition cursor-pointer min-h-[36px] navbar__logout"
                onClick={onLogout}
                disabled={disabled}
                aria-label={isDemoMode ? "デモを終了" : "ログアウト"}
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isDemoMode ? "デモを終了" : "ログアウト"}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
