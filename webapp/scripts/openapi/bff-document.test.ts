import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBffOpenApiDocument } from "./bff-document";
import { generateBffOpenApiJsonFile } from "./generate.mjs";

describe("BFF OpenAPI 3.1.0 ドキュメント生成 (buildBffOpenApiDocument)", () => {
  it("OpenAPI 3.1.0 メタデータ・主要パス・components.schemas を含む仕様書を生成し、非公開化に伴い /api/openapi.json は含まないこと", () => {
    const doc = buildBffOpenApiDocument();

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("FeedsToBook BFF API");
    expect(doc.paths?.["/api/epub"]?.post).toBeDefined();
    expect(doc.paths?.["/api/epub/demo"]?.post).toBeDefined();
    expect(doc.paths?.["/api/openapi.json"]).toBeUndefined();

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
});

describe("BFF OpenAPI JSON ファイル出力 (generateBffOpenApiJsonFile)", () => {
  it("一時ディレクトリへ整形済みの bff-api.openapi.json を書き出せること", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bff-openapi-test-"));
    try {
      const { jsonPath } = await generateBffOpenApiJsonFile({ outputDir: tempDir });
      expect(fs.existsSync(jsonPath)).toBe(true);

      const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
        openapi: string;
        paths: Record<string, unknown>;
      };
      expect(parsed.openapi).toBe("3.1.0");
      expect(parsed.paths["/api/epub"]).toBeDefined();
      expect(parsed.paths["/api/epub/demo"]).toBeDefined();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
