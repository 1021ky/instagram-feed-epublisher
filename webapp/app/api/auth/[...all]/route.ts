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

export const GET = async (request: Request) => {
  logAuthRequest(request);
  return handlers.GET(request);
};

export const POST = async (request: Request) => {
  logAuthRequest(request);
  return handlers.POST(request);
};
