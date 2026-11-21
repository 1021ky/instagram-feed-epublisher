/**
 * @file Better Auth Next.js route handler.
 */
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Next.js route handlers for Better Auth.
 */
const handlers = toNextJsHandler(auth);

const sensitiveParams = new Set([
  "code",
  "state",
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
]);

const sanitizeParams = (url: URL) => {
  const result: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (sensitiveParams.has(key)) {
      result[key] = `***(${value.length})`;
    } else {
      result[key] = value;
    }
  });
  return result;
};

const logAuthRequest = (request: Request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/auth/")) {
    return;
  }
  if (!pathname.includes("sign-in") && !pathname.includes("callback")) {
    return;
  }
  console.info("[auth] request", {
    method: request.method,
    pathname,
    params: sanitizeParams(url),
    host: request.headers.get("host"),
    proto: request.headers.get("x-forwarded-proto") ?? url.protocol,
  });
};

/**
 * 別アカウントログイン（`?force_reauth=true`）が要求された場合、
 * Better Auth が生成した認可リダイレクト URL に `force_reauth=true` を付与して返却します。
 * `redirect_uri`（`/api/auth/oauth2/callback/instagram`）や `state` 発行処理は変更しません。
 */
async function appendForceReauthIfRequested(
  request: Request,
  response: Response,
): Promise<Response> {
  const requestUrl = new URL(request.url);
  if (
    requestUrl.pathname !== "/api/auth/sign-in/oauth2" ||
    requestUrl.searchParams.get("force_reauth") !== "true"
  ) {
    return response;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    return response;
  }

  const cloned = response.clone();
  let payload: { url?: unknown; [key: string]: unknown };
  try {
    payload = (await cloned.json()) as { url?: unknown; [key: string]: unknown };
  } catch {
    return response;
  }

  if (typeof payload.url !== "string" || !payload.url) {
    return response;
  }

  const authorizeUrl = new URL(payload.url);
  authorizeUrl.searchParams.set("force_reauth", "true");

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(JSON.stringify({ ...payload, url: authorizeUrl.toString() }), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const GET = async (request: Request) => {
  logAuthRequest(request);
  return handlers.GET(request);
};

export const POST = async (request: Request) => {
  logAuthRequest(request);
  const response = await handlers.POST(request);
  return appendForceReauthIfRequested(request, response);
};
