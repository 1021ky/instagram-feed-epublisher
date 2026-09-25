"use client";

import { LogOut } from "lucide-react";
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
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
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
