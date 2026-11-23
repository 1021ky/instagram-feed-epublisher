/**
 * @file BFF API OpenAPI 3.1.0 ドキュメント配信エンドポイント (`GET /api/openapi.json`)。
 */
import { NextResponse } from "next/server";
import { buildBffOpenApiDocument } from "@/lib/openapi/bff-document";

/**
 * Zod v4 スキーマから生成された OpenAPI 3.1.0 仕様書を JSON 形式で返却します。
 */
export async function GET() {
  return NextResponse.json(buildBffOpenApiDocument());
}
