import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "feedstobook.ksanchu.page";

// NOTE: インフラコスト最小化のため GCLB 等を置かず Cloud Run Domain Mapping を採用しており
// （terraform/cloud_run.tf 参照）、*.run.app への直接アクセスをアプリ側で正規ホストへ寄せる。
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Cloud Run やリバースプロキシ環境では x-forwarded-host にクライアントのアクセスドメインが入る
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const currentHost = (forwardedHost || hostHeader || request.nextUrl.host)
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();

  if (currentHost === CANONICAL_HOST) {
    return NextResponse.next();
  }

  // ポート番号（Cloud Run コンテナの 8080 等）が混入しないよう、プロトコルとホストを明示して新規構築
  const redirectUrl = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    `https://${CANONICAL_HOST}`,
  );

  return NextResponse.redirect(redirectUrl, 301);
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon\\.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
