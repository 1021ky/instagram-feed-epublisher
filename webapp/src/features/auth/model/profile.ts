import type { DemoFeedData, UserProfile } from "@/types/ui";

/**
 * Better Auth セッションに含まれるユーザー情報の最小入力型。
 */
export interface SessionUserInput {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const INSTAGRAM_LOCAL_EMAIL_SUFFIX = "@instagram.local";

/**
 * セッションのユーザー情報から画面表示用のプロフィールを生成する。
 * `name` が欠けている場合は `@instagram.local` メールのローカル部をフォールバックとして使用する。
 */
export function toLoggedInUserProfile(
  user: SessionUserInput | null | undefined,
): UserProfile | null {
  if (!user) {
    return null;
  }

  const fallbackUsername = user.email?.endsWith(INSTAGRAM_LOCAL_EMAIL_SUFFIX)
    ? user.email.slice(0, -INSTAGRAM_LOCAL_EMAIL_SUFFIX.length)
    : undefined;

  return {
    id: user.id,
    username: user.name ?? fallbackUsername,
    displayName: user.name ?? fallbackUsername,
    avatarUrl: user.image ?? undefined,
  };
}

/**
 * デモ体験モード時に表示する仮のユーザープロフィールを生成する。
 */
export function createDemoUserProfile(
  demo: Pick<DemoFeedData, "username" | "avatarUrl">,
): UserProfile {
  return {
    id: "demo-user",
    username: demo.username,
    displayName: "Demo User",
    avatarUrl: demo.avatarUrl,
  };
}

/**
 * ユーザー名の先頭 `@` を除去した正規化文字列を返す。
 */
export function normalizeUsername(username?: string | null): string {
  return username?.replace(/^@/, "") ?? "";
}

/**
 * ログアウト直後のステータスバナーに表示する見出し文言を生成する。
 */
export function formatLogoutBannerTitle(username?: string): string {
  const trimmed = username?.trim();
  if (!trimmed) {
    return "FeedsToBook からログアウトしました";
  }
  const normalized = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  return `FeedsToBook からログアウトしました（${normalized}）`;
}
