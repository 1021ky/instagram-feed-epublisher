/**
 * @file 退会 API ルート。
 * Better Auth の認証 Cookie を破棄し、サーバー側のステートレスセッションを完全クリアする。
 *
 * 【Instagram 側の認可失効に関する仕様上の注意】
 * Meta / Instagram Graph API では、サードパーティアプリからユーザーの認可（許可済みアプリ）を
 * リモートで抹消・アンインストールする API エンドポイント（DELETE /me/permissions）は提供されていません。
 * そのため、本アプリ側の退会責務は保持しているセッション・暗号化 Cookie を破棄して
 * トークン利用を終了することであり、Instagram アカウント側の連携登録を完全に解除するには
 * ユーザー本人が Instagram の「設定 > アプリとウェブサイト」から削除する必要があります。
 */
import { NextResponse } from "next/server";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.user.delete");

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
 * `POST /api/user/delete` を処理する。
 *
 * 現在のセッション（ログイン状態）を確認し、Better Auth Cookie を削除して
 * クライアントを未ログイン状態へ戻す責務を持つ。
 *
 * @param request - 呼び出し元の HTTP リクエスト
 * @returns 成功時は `{ ok: true }`、未ログイン時は 401 JSON レスポンス
 */
export async function POST(request: Request) {
  try {
    // ログイン状態（有効なアクセストークンCookie）が存在することを確認
    await resolveInstagramAccessToken(request);

    const response = NextResponse.json({ ok: true });
    clearBetterAuthCookies(response, request);

    logger.info("User session and cookies cleared for account deletion", {
      cookieCount: betterAuthCookieNames.length * 3,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    const status = message === "未ログインです" ? 401 : 500;

    logger.error("User deletion failed", { error: message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
