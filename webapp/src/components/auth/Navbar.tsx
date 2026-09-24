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
  const accountLabel = user?.username ? `@${user.username}` : user?.displayName;

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="eyebrow font-semibold text-blue-600 text-xs sm:text-sm m-0">
              Instagram Feeds to E-Book
            </p>
            <span className="badge navbar__badge">Kindle対応</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 m-0">
            FeedsToBook
          </h1>
          <p className="text-sm font-semibold text-slate-700 mt-1 mb-0">
            流れるフィードを、ずっと手元に残る一冊に。
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mt-1 mb-0 leading-relaxed">
            日々の投稿や100日チャレンジをまとめて、Kindleや電子書籍リーダーで読める本に仕立てます。
          </p>
        </div>
      </div>

      {user && (onLogout || onDeleteAccount) ? (
        <div className="navbar__account">
          <div className="navbar__profile">
            {user.avatarUrl ? (
              <img
                className="navbar__avatar"
                src={user.avatarUrl}
                alt={`${accountLabel ?? "ユーザー"} のアイコン`}
              />
            ) : (
              <span className="navbar__avatar navbar__avatar--fallback" aria-hidden="true">
                {getInitials(user)}
              </span>
            )}
            <div>
              <strong>{accountLabel ?? "Instagram user"}</strong>
              <p>{isDemoMode ? "デモ体験モード" : "ログイン済み"}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {!isDemoMode && onDeleteAccount ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 bg-white/80 transition cursor-pointer min-h-[36px] shadow-2xs"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white/80 transition cursor-pointer min-h-[36px] shadow-2xs navbar__logout"
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
