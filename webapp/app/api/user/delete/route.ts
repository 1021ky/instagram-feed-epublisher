/**
 * @file Account deletion route that revokes Instagram access and clears auth cookies.
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

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

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
