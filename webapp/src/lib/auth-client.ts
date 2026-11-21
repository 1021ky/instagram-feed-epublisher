/**
 * @file Better Auth client for the Next.js UI.
 */
import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

/**
 * Better Auth client instance.
 */
export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
});

/**
 * Instagram OAuth ログインを開始します。
 */
export async function signInWithInstagram() {
  return authClient.signIn.oauth2({
    providerId: "instagram",
    callbackURL: "/?scroll=filters",
  });
}

/**
 * ログアウト直後のステータスバナーに表示する見出しを生成します。
 */
export function formatLogoutBannerTitle(username?: string): string {
  const trimmed = username?.trim();
  if (!trimmed) {
    return "FeedsToBook からログアウトしました";
  }
  const normalized = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  return `FeedsToBook からログアウトしました（${normalized}）`;
}
