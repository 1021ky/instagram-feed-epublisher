/**
 * @file BFF API の OpenAPI 3.1.0 仕様書 JSON および静的 HTML ドキュメントを `docs/openapi/` へ生成するスクリプト。
 *
 * Usage:
 *   node scripts/generate-bff-openapi.mjs          # docs/openapi/bff-api.openapi.json と docs/openapi/index.html を生成
 *   node scripts/generate-bff-openapi.mjs --check  # 生成済みファイルが最新のスキーマと一致しているか検証
 */
import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format as formatWithOxfmt } from "oxfmt";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webappDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webappDir, "..");
const srcDir = path.join(webappDir, "src");

export const DEFAULT_OUTPUT_DIR = path.join(repoRoot, "docs", "openapi");
export const OPENAPI_JSON_FILENAME = "bff-api.openapi.json";
export const OPENAPI_HTML_FILENAME = "index.html";

let hooksRegistered = false;

/**
 * Node.js ESM で `@/*` パスエイリアスと `.ts` モジュールを直接解決・トランスパイルするためのフックを登録します。
 */
export function ensureTsLoaderHooks() {
  if (hooksRegistered) {
    return;
  }

  registerHooks({
    resolve(specifier, context, nextResolve) {
      let candidatePath = null;

      if (specifier.startsWith("@/")) {
        candidatePath = path.join(srcDir, specifier.slice(2));
      } else if (
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        context.parentURL?.startsWith("file:")
      ) {
        const parentDir = path.dirname(fileURLToPath(context.parentURL));
        const resolved = path.resolve(parentDir, specifier);
        if (!path.extname(resolved)) {
          candidatePath = resolved;
        }
      }

      if (candidatePath) {
        const tsFile = `${candidatePath}.ts`;
        if (fs.existsSync(tsFile)) {
          return {
            url: pathToFileURL(tsFile).href,
            shortCircuit: true,
          };
        }
        const indexTsFile = path.join(candidatePath, "index.ts");
        if (fs.existsSync(indexTsFile)) {
          return {
            url: pathToFileURL(indexTsFile).href,
            shortCircuit: true,
          };
        }
      }

      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url.startsWith("file:") && url.endsWith(".ts")) {
        const filePath = fileURLToPath(url);
        const source = fs.readFileSync(filePath, "utf8");
        const transpiled = ts.transpileModule(source, {
          fileName: filePath,
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            verbatimModuleSyntax: false,
          },
        });
        return {
          format: "module",
          source: transpiled.outputText,
          shortCircuit: true,
        };
      }

      return nextLoad(url, context);
    },
  });

  hooksRegistered = true;
}

/**
 * Zod v4 スキーマから OpenAPI 3.1.0 JSON 文字列および静的 HTML 文字列を構築します。
 */
export async function createBffOpenApiArtifacts() {
  ensureTsLoaderHooks();

  const bffDocumentModule = await import(
    pathToFileURL(path.join(srcDir, "lib", "openapi", "bff-document.ts")).href
  );
  const renderHtmlModule = await import(
    pathToFileURL(path.join(srcDir, "lib", "openapi", "render-html.ts")).href
  );

  const document = bffDocumentModule.buildBffOpenApiDocument();
  const rawJsonContent = `${JSON.stringify(document, null, 2)}\n`;
  const rawHtmlContent = renderHtmlModule.renderOpenApiHtml(document);

  const [formattedJson, formattedHtml] = await Promise.all([
    formatWithOxfmt(OPENAPI_JSON_FILENAME, rawJsonContent),
    formatWithOxfmt(OPENAPI_HTML_FILENAME, rawHtmlContent),
  ]);

  return {
    document,
    jsonContent: formattedJson.code,
    htmlContent: formattedHtml.code,
  };
}

/**
 * `docs/openapi/` 配下へ `bff-api.openapi.json` と `index.html` を書き出します。
 */
export async function generateBffOpenApiFiles({ outputDir = DEFAULT_OUTPUT_DIR } = {}) {
  const { jsonContent, htmlContent } = await createBffOpenApiArtifacts();
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, OPENAPI_JSON_FILENAME);
  const htmlPath = path.join(outputDir, OPENAPI_HTML_FILENAME);

  fs.writeFileSync(jsonPath, jsonContent, "utf8");
  fs.writeFileSync(htmlPath, htmlContent, "utf8");

  return { jsonPath, htmlPath };
}

/**
 * 既存の `docs/openapi/` 出力ファイルが最新の Zod スキーマ定義と一致しているか検証します。
 */
export async function checkBffOpenApiFiles({ outputDir = DEFAULT_OUTPUT_DIR } = {}) {
  const { jsonContent, htmlContent } = await createBffOpenApiArtifacts();
  const jsonPath = path.join(outputDir, OPENAPI_JSON_FILENAME);
  const htmlPath = path.join(outputDir, OPENAPI_HTML_FILENAME);

  const diffs = [];
  if (!fs.existsSync(jsonPath) || fs.readFileSync(jsonPath, "utf8") !== jsonContent) {
    diffs.push(jsonPath);
  }
  if (!fs.existsSync(htmlPath) || fs.readFileSync(htmlPath, "utf8") !== htmlContent) {
    diffs.push(htmlPath);
  }

  return {
    upToDate: diffs.length === 0,
    diffs,
  };
}

function isMainModule() {
  return process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  const isCheckMode = process.argv.includes("--check");
  if (isCheckMode) {
    const result = await checkBffOpenApiFiles();
    if (!result.upToDate) {
      console.error(
        "OpenAPI 出力ファイルが最新ではありません。`pnpm openapi:generate` を実行してください:",
      );
      for (const filePath of result.diffs) {
        console.error(` - ${path.relative(repoRoot, filePath)}`);
      }
      process.exit(1);
    }
    console.log("OpenAPI 出力ファイルは最新です。");
  } else {
    const { jsonPath, htmlPath } = await generateBffOpenApiFiles();
    console.log(`Generated: ${path.relative(repoRoot, jsonPath)}`);
    console.log(`Generated: ${path.relative(repoRoot, htmlPath)}`);
  }
}
