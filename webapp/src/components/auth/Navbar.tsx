"use client";

import type { UserProfile } from "@/types/ui";

type NavbarProps = {
  disabled?: boolean;
  isDemoMode?: boolean;
  onLogout?: () => void;
  user?: UserProfile | null;
};

function getInitials(user?: UserProfile | null) {
  const label = user?.username ?? user?.displayName ?? "IG";
  return label.slice(0, 2).toUpperCase();
}

export function Navbar({ disabled = false, isDemoMode = false, onLogout, user }: NavbarProps) {
  const accountLabel = user?.username ? `@${user.username}` : user?.displayName;

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <div>
          <p className="navbar__eyebrow">Instagramフィード → EPUB</p>
          <strong>Challenge Reader</strong>
        </div>
        <span className="badge navbar__badge">Kindle対応</span>
      </div>

      {user && onLogout ? (
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
          <button className="ghost navbar__logout" onClick={onLogout} disabled={disabled}>
            {isDemoMode ? "デモを終了" : "ログアウト"}
          </button>
        </div>
      ) : null}
    </nav>
  );
}
