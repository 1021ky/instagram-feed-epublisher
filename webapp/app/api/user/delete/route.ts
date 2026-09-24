/**
 * @file 退会 API ルート。
 * Instagram 側の認可失効を試行し、Better Auth の認証 Cookie を破棄する。
 */
import { NextResponse } from "next/server";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.user.delete");

const revokeEndpoints = [
  "https://graph.instagram.com/me/permissions",
  "https://graph.facebook.com/me/permissions",
] as const;

const betterAuthCookieNames = [
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.account_data",
  "better-auth.dont_remember",
  "better-auth.two_factor",
] as const;

/**
 * リクエストがセキュアコンテキスト上で処理されているかを判定する。
 *
 * @param request - 現在処理中の HTTP リクエスト
 * @returns Cookie に secure 属性を付与すべき場合は `true`
 */
function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

/**
 * Better Auth が利用する主要 Cookie をすべて期限切れにする。
 *
 * `better-auth.*` と `__Secure-` / `__Host-` 接頭辞付きの候補をまとめて失効し、
 * ブラウザ上の認証状態を確実に破棄する責務を持つ。
 *
 * @param response - 失効用の Set-Cookie ヘッダーを書き込むレスポンス
 * @param request - secure 属性判定に利用する元リクエスト
 * @returns なし
 */
function clearBetterAuthCookies(response: NextResponse, request: Request) {
  const secure = isSecureRequest(request);

  for (const name of betterAuthCookieNames) {
    for (const candidate of [name, `__Secure-${name}`, `__Host-${name}`]) {
      response.cookies.set({
        name: candidate,
        value: "",
        expires: new Date(0),
        maxAge: 0,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure,
      });
    }
  }
}

/**
 * Instagram / Facebook Graph API に対して認可失効を順次試行する。
 *
 * 先に Instagram Graph API のエンドポイントを試し、失敗した場合のみ
 * Facebook Graph API 側へフォールバックする責務を持つ。
 *
 * @param accessToken - 現在のログインセッションから解決した Instagram アクセストークン
 * @returns 失効に成功した時点で `Promise<void>` を完了する
 * @throws Error すべての失効先で失敗した場合
 */
async function revokeInstagramAuthorization(accessToken: string) {
  const failures: Array<{ endpoint: string; status?: number; body?: string; error?: string }> = [];

  for (const endpoint of revokeEndpoints) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("access_token", accessToken);

      const response = await fetch(url.toString(), {
        method: "DELETE",
      });

      if (response.ok) {
        logger.info("Instagram authorization revoked", { endpoint });
        return;
      }

      const body = await response.text();
      failures.push({ endpoint, status: response.status, body });
      logger.debug("Instagram revoke endpoint failed", {
        endpoint,
        status: response.status,
        body,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      failures.push({ endpoint, error: message });
      logger.debug("Instagram revoke endpoint failed with exception", {
        endpoint,
        error: message,
      });
    }
  }

  throw new Error(
    failures.some((failure) => failure.status === 401 || failure.status === 403)
      ? "Instagram 連携の解除権限が確認できませんでした"
      : "Instagram 連携の解除に失敗しました",
  );
}

/**
 * `POST /api/user/delete` を処理する。
 *
 * 現在のセッションからアクセストークンを取得し、Instagram 側の認可失効を試みたうえで
 * Better Auth Cookie を削除し、クライアントを未ログイン状態へ戻す責務を持つ。
 *
 * @param request - 呼び出し元の HTTP リクエスト
 * @returns 成功時は `{ ok: true }`、失敗時はエラー内容を含む JSON レスポンス
 */
export async function POST(request: Request) {
  try {
    const accessToken = await resolveInstagramAccessToken(request);
    await revokeInstagramAuthorization(accessToken);

    const response = NextResponse.json({ ok: true });
    clearBetterAuthCookies(response, request);

    logger.info("User authorization deleted", {
      cookieCount: betterAuthCookieNames.length * 3,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    const status = message === "未ログインです" ? 401 : 502;

    logger.error("User deletion failed", { error: message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
