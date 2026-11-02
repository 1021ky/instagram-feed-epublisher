/**
 * @file Better Auth configuration with Instagram OAuth.
 */
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { resolveMetaGraphApiBaseUrl } from "@/lib/instagram/meta-api-client";

export const DEFAULT_INSTAGRAM_OAUTH_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
export const DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

/**
 * 実行時の Instagram OAuth エンドポイント URL（認可・トークン交換）を解決します。
 * E2E テストや契約テスト時に `INSTAGRAM_OAUTH_AUTHORIZE_URL` / `INSTAGRAM_OAUTH_TOKEN_URL` で切り替え可能です。
 */
export function resolveInstagramOAuthUrls(): {
  authorizeUrl: string;
  tokenUrl: string;
} {
  const authorizeUrl =
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL?.trim().replace(/\/+$/, "") ||
    DEFAULT_INSTAGRAM_OAUTH_AUTHORIZE_URL;
  const tokenUrl =
    process.env.INSTAGRAM_OAUTH_TOKEN_URL?.trim().replace(/\/+$/, "") ||
    DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL;
  return { authorizeUrl, tokenUrl };
}

const { authorizeUrl: instagramAuthorizeUrl, tokenUrl: instagramTokenUrl } =
  resolveInstagramOAuthUrls();

/**
 * Instagram 認可コードからアクセストークン（長期トークン）およびプロファイルを並列取得します。
 */
export async function exchangeInstagramToken({
  code,
  redirectURI,
}: {
  code: string;
  redirectURI: string;
}) {
  const form = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID ?? "",
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    redirect_uri: redirectURI,
    code,
  });

  const { tokenUrl } = resolveInstagramOAuthUrls();
  const shortResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!shortResponse.ok) {
    const errorText = await shortResponse.text();
    throw new Error(`Instagram token exchange failed: ${shortResponse.status} ${errorText}`);
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

  // 高速化: 長期トークン交換とユーザー情報 (/me) 取得を短期トークンで並列実行 (Promise.all)
  const longUrl = new URL(`${resolveMetaGraphApiBaseUrl()}/access_token`);
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", process.env.INSTAGRAM_CLIENT_SECRET ?? "");
  longUrl.searchParams.set("access_token", shortAccessToken);

  const userUrl = new URL(`${resolveMetaGraphApiBaseUrl()}/me`);
  userUrl.searchParams.set("fields", "id,username");
  userUrl.searchParams.set("access_token", shortAccessToken);

  const [longResponse, userResponse] = await Promise.all([
    fetch(longUrl.toString()),
    fetch(userUrl.toString()),
  ]);

  if (!longResponse.ok) {
    const errorText = await longResponse.text();
    throw new Error(
      `Instagram long-lived token exchange failed: ${longResponse.status} ${errorText}`,
    );
  }

  const longPayload = (await longResponse.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };

  let preloadedProfile: { id: string; username?: string } | undefined;
  if (userResponse.ok) {
    try {
      const userPayload = (await userResponse.json()) as {
        id?: string | number;
        username?: string;
      };
      if (userPayload.id) {
        preloadedProfile = {
          id: String(userPayload.id),
          username: userPayload.username,
        };
      }
    } catch {
      // パース失敗時は getUserInfo 側のフォールバックに委ねる
    }
  }

  const longAccessToken = longPayload.access_token ?? shortAccessToken;
  const expiresIn = longPayload.expires_in ?? shortPayload.expires_in ?? 0;

  return {
    accessToken: longAccessToken,
    accessTokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
    scopes: [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "instagram_business_manage_comments",
      "instagram_business_manage_messages",
    ],
    raw: {
      short: shortPayload,
      long: longPayload,
      profile: preloadedProfile,
    },
  };
}

/**
 * トークン情報からユーザープロファイル情報を返却します。
 * 事前取得（並列取得）されたプロファイルがある場合は追加通信なしで即時返却します。
 */
export async function getInstagramUserInfo(tokens: { accessToken?: string; raw?: unknown }) {
  const preloaded = (tokens.raw as { profile?: { id: string; username?: string } } | undefined)
    ?.profile;
  if (preloaded?.id) {
    return {
      id: preloaded.id,
      name: preloaded.username ?? "instagram-user",
      email: `${preloaded.username ?? preloaded.id}@instagram.local`,
      emailVerified: false,
      image: undefined,
    };
  }

  if (!tokens.accessToken) {
    throw new Error("Instagram access token missing for user info");
  }

  const url = new URL(`${resolveMetaGraphApiBaseUrl()}/me`);
  url.searchParams.set("fields", "id,username");
  url.searchParams.set("access_token", tokens.accessToken);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instagram user info failed: ${response.status} ${errorText}`);
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
    emailVerified: false,
    image: undefined,
  };
}

/**
 * Better Auth instance configured for Instagram SSO with stateless session.
 */
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwe",
      refreshCache: true,
    },
  },
  account: {
    storeAccountCookie: true,
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "instagram",
          clientId: process.env.INSTAGRAM_CLIENT_ID as string,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET as string,
          authorizationUrl: instagramAuthorizeUrl,
          tokenUrl: instagramTokenUrl,
          scopes: ["instagram_business_basic"],
          authorizationUrlParams: {
            enable_fb_login: "0",
            force_authentication: "1",
            scope: "instagram_business_basic",
          },
          getToken: exchangeInstagramToken,
          getUserInfo: getInstagramUserInfo,
        },
      ],
    }),
    nextCookies(),
  ],
});
