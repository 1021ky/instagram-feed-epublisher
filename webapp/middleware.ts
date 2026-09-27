import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "feedstobook.ksanchu.page";

const isLocalRequest = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const { nextUrl } = request;
  const { hostname, pathname } = nextUrl;

  if (hostname === CANONICAL_HOST || isLocalRequest(hostname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const redirectUrl = nextUrl.clone();
  redirectUrl.protocol = "https";
  redirectUrl.host = CANONICAL_HOST;

  return NextResponse.redirect(redirectUrl, 301);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
