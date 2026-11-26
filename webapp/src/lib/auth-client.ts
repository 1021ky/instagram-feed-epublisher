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

export async function signInWithInstagram() {
  return authClient.signIn.oauth2({
    providerId: "instagram",
    callbackURL: "/?scroll=filters",
  });
}
