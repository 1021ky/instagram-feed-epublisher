/**
 * @file EPUB生成API向けの共通 HTTP レスポンスおよびエラーマッピングヘルパー。
 */
import { NextResponse } from "next/server";
import { EpubRequestValidationError } from "@/lib/epub/epub-request.schema";
import { InstagramGraphApiError } from "@/lib/instagram/meta-api-client";

type ErrorLogger = {
  error: (message: string, meta?: Record<string, unknown>) => void;
};

/**
 * EPUBバイナリのダウンロードレスポンスを生成します。
 */
export function createEpubDownloadResponse(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}

/**
 * 例外種別に応じた適切な HTTP ステータスコードを解決します。
 */
export function resolveEpubErrorStatus(error: unknown): number {
  if (error instanceof EpubRequestValidationError || error instanceof SyntaxError) {
    return 400;
  }
  if (error instanceof InstagramGraphApiError) {
    return error.recommendedHttpStatus;
  }
  if (error instanceof Error && error.message === "未ログインです") {
    return 401;
  }
  return 500;
}

/**
 * EPUB生成APIの例外をログ記録しつつ、統一フォーマットの JSON エラーレスポンスへ変換します。
 */
export function toEpubErrorResponse(
  error: unknown,
  logger: ErrorLogger,
  logLabel: string,
): NextResponse {
  const message = error instanceof Error ? error.message : "不明なエラー";
  const status = resolveEpubErrorStatus(error);
  const stack = status >= 500 && error instanceof Error ? error.stack : undefined;

  logger.error(logLabel, {
    error: message,
    status,
    ...(stack ? { stack } : {}),
  });

  return NextResponse.json({ error: message }, { status });
}
