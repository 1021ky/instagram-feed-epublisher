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
 * `forceReauth: true` を指定した場合は、Instagram 側で再認証（別アカウントログイン）を強制します。
 */
export async function signInWithInstagram({ forceReauth = false }: { forceReauth?: boolean } = {}) {
  return authClient.signIn.oauth2({
    providerId: "instagram",
    callbackURL: "/?scroll=filters",
    ...(forceReauth ? { fetchOptions: { query: { force_reauth: "true" } } } : {}),
  });
}
