/**
 * @file BFF API OpenAPI 3.1.0 ドキュメント生成・HTML レンダリング・静的ファイル同期のテスト。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkBffOpenApiFiles,
  generateBffOpenApiFiles,
} from "../../../scripts/generate-bff-openapi.mjs";
import { buildBffOpenApiDocument } from "@/lib/openapi/bff-document";
import { escapeHtml, renderOpenApiHtml } from "@/lib/openapi/render-html";

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

describe("静的 OpenAPI HTML レンダリング (renderOpenApiHtml)", () => {
  it("エンドポイント・スキーマ・埋め込み JSON を含む自己完結型 HTML を生成すること", () => {
    const doc = buildBffOpenApiDocument();
    const html = renderOpenApiHtml(doc);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("FeedsToBook BFF API");
    expect(html).toContain("/api/epub");
    expect(html).toContain("/api/epub/demo");
    expect(html).toContain("EpubRequestBody");
    expect(html).toContain("Internal BFF Only");
    expect(html).toContain('<script id="openapi-spec" type="application/json">');
    expect(html).not.toContain("https://cdn.");
  });

  it("HTML および JSON 埋め込みで XSS を誘発する特殊文字を適切にエスケープすること", () => {
    expect(escapeHtml(`<script>alert("xss")</script> & 'test'`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;",
    );

    const html = renderOpenApiHtml({
      openapi: "3.1.0",
      info: {
        title: "Test </script><script>alert(1)</script>",
        version: "1.0.0",
        description: "Desc & <img src=x>",
      },
      paths: {},
      components: { schemas: {} },
    });

    expect(html).not.toContain("</script><script>alert(1)</script>");
    expect(html).toContain("\\u003c/script\\u003e");
  });
});

describe("docs/openapi 静的ドキュメント生成と同期チェック", () => {
  it("一時ディレクトリへ bff-api.openapi.json と index.html を生成・検証できること", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bff-openapi-test-"));
    try {
      const { jsonPath, htmlPath } = await generateBffOpenApiFiles({ outputDir: tempDir });
      expect(fs.existsSync(jsonPath)).toBe(true);
      expect(fs.existsSync(htmlPath)).toBe(true);

      const check = await checkBffOpenApiFiles({ outputDir: tempDir });
      expect(check.upToDate).toBe(true);
      expect(check.diffs).toEqual([]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("未生成または内容が古い出力ディレクトリに対して checkBffOpenApiFiles が差分を検知できること", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bff-openapi-stale-"));
    try {
      const missingCheck = await checkBffOpenApiFiles({ outputDir: tempDir });
      expect(missingCheck.upToDate).toBe(false);
      expect(missingCheck.diffs).toHaveLength(2);

      const { jsonPath } = await generateBffOpenApiFiles({ outputDir: tempDir });
      fs.writeFileSync(jsonPath, '{"stale":true}\n', "utf8");

      const staleCheck = await checkBffOpenApiFiles({ outputDir: tempDir });
      expect(staleCheck.upToDate).toBe(false);
      expect(staleCheck.diffs).toEqual([jsonPath]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
