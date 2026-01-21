/**
 * @file Better Auth configuration with Instagram OAuth.
 */
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

const databasePath = process.env.BETTER_AUTH_DB_PATH ?? "./better-auth.db";

/**
 * Better Auth instance configured for Instagram SSO.
 */
export const auth = betterAuth({
  database: new Database(databasePath),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "instagram",
          clientId: process.env.INSTAGRAM_CLIENT_ID as string,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET as string,
          authorizationUrl: "https://www.instagram.com/oauth/authorize",
          tokenUrl: "https://api.instagram.com/oauth/access_token",
          scopes: [
            "instagram_business_basic",
            "instagram_business_content_publish",
            "instagram_business_manage_comments",
            "instagram_business_manage_messages",
          ],
          getToken: async ({ code, redirectURI }) => {
            const form = new URLSearchParams({
              client_id: process.env.INSTAGRAM_CLIENT_ID ?? "",
              client_secret: process.env.INSTAGRAM_CLIENT_SECRET ?? "",
              grant_type: "authorization_code",
              redirect_uri: redirectURI,
              code,
            });

            const shortResponse = await fetch(
              "https://api.instagram.com/oauth/access_token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: form.toString(),
              }
            );

            if (!shortResponse.ok) {
              const errorText = await shortResponse.text();
              throw new Error(
                `Instagram token exchange failed: ${shortResponse.status} ${errorText}`
              );
            }

            const shortPayload = (await shortResponse.json()) as {
              access_token?: string;
              user_id?: string;
              token_type?: string;
              expires_in?: number;
            };

            const shortAccessToken = shortPayload.access_token;
            if (!shortAccessToken) {
              throw new Error("Instagram access token missing from response");
            }

            const longUrl = new URL("https://graph.instagram.com/access_token");
            longUrl.searchParams.set("grant_type", "ig_exchange_token");
            longUrl.searchParams.set(
              "client_secret",
              process.env.INSTAGRAM_CLIENT_SECRET ?? ""
            );
            longUrl.searchParams.set("access_token", shortAccessToken);

            const longResponse = await fetch(longUrl.toString());
            if (!longResponse.ok) {
              const errorText = await longResponse.text();
              throw new Error(
                `Instagram long-lived token exchange failed: ${longResponse.status} ${errorText}`
              );
            }

            const longPayload = (await longResponse.json()) as {
              access_token?: string;
              token_type?: string;
              expires_in?: number;
            };

            const longAccessToken = longPayload.access_token ?? shortAccessToken;
            const expiresIn = longPayload.expires_in ?? shortPayload.expires_in ?? 0;

            return {
              accessToken: longAccessToken,
              accessTokenExpiresAt: expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : undefined,
              scopes: [
                "instagram_business_basic",
                "instagram_business_content_publish",
                "instagram_business_manage_comments",
                "instagram_business_manage_messages",
              ],
              raw: {
                short: shortPayload,
                long: longPayload,
              },
            };
          },
          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) {
              throw new Error("Instagram access token missing for user info");
            }

            const url = new URL("https://graph.instagram.com/me");
            url.searchParams.set("fields", "id,username");
            url.searchParams.set("access_token", tokens.accessToken);

            const response = await fetch(url.toString());
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Instagram user info failed: ${response.status} ${errorText}`
              );
            }

            const payload = (await response.json()) as {
              id?: string | number;
              username?: string;
            };

            const id = payload.id ? String(payload.id) : undefined;
            if (!id) {
              throw new Error("Instagram user id missing from user info");
            }

            return {
              id,
              name: payload.username ?? "instagram-user",
              email: `${payload.username ?? id}@instagram.local`,
              image: undefined,
            };
          },
        },
      ],
    }),
    nextCookies(),
  ],
});
