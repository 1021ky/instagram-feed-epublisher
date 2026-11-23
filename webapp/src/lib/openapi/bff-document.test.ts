/**
 * @file BFF API OpenAPI 3.1.0 ドキュメント生成および配信ルートの単体テスト。
 */
import { describe, expect, it } from "vitest";
import { GET } from "../../../app/api/openapi.json/route";
import { buildBffOpenApiDocument } from "@/lib/openapi/bff-document";

describe("BFF OpenAPI 3.1.0 ドキュメント生成 (buildBffOpenApiDocument)", () => {
  it("OpenAPI 3.1.0 メタデータ・主要パス・components.schemas を含む仕様書を生成すること", () => {
    const doc = buildBffOpenApiDocument();

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("FeedsToBook BFF API");
    expect(doc.paths?.["/api/epub"]?.post).toBeDefined();
    expect(doc.paths?.["/api/epub/demo"]?.post).toBeDefined();
    expect(doc.paths?.["/api/openapi.json"]?.get).toBeDefined();

    const schemas = doc.components?.schemas as Record<string, unknown> | undefined;
    expect(schemas?.CoverThemeId).toBeDefined();
    expect(schemas?.EpubSortOrder).toBeDefined();
    expect(schemas?.EpubFeedFilter).toBeDefined();
    expect(schemas?.EpubMetadata).toBeDefined();
    expect(schemas?.EpubRequestBody).toBeDefined();
    expect(schemas?.EpubDemoRequestBody).toBeDefined();
    expect(schemas?.EpubErrorResponse).toBeDefined();
  });

  it("POST /api/epub が application/epub+zip (200) と エラーレスポンス (400/401/429/502/504/500) を定義していること", () => {
    const doc = buildBffOpenApiDocument();
    const responses = doc.paths?.["/api/epub"]?.post?.responses as
      | Record<string, { content?: Record<string, unknown> }>
      | undefined;

    expect(responses?.["200"]?.content?.["application/epub+zip"]).toBeDefined();
    expect(responses?.["400"]?.content?.["application/json"]).toBeDefined();
    expect(responses?.["401"]?.content?.["application/json"]).toBeDefined();
    expect(responses?.["429"]?.content?.["application/json"]).toBeDefined();
    expect(responses?.["502"]?.content?.["application/json"]).toBeDefined();
    expect(responses?.["504"]?.content?.["application/json"]).toBeDefined();
    expect(responses?.["500"]?.content?.["application/json"]).toBeDefined();
  });

  it("GET /api/openapi.json が HTTP 200 で OpenAPI 3.1.0 JSON を返却すること", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/api/epub"]).toBeDefined();
  });
});
